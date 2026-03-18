use std::fs::read_to_string;
use std::time::Instant;

use anyhow::anyhow;
use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use filesys::check_file_exists::check_file_exists;
use filesys::file_size::file_size;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::generic_insert::insert_media_file_generic_from_job::{insert_media_file_generic_from_job, InsertFromJobArgs};
use mysql_queries::queries::media_files::get::get_media_file_for_inference::MediaFileForInference;
use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::render_engine_scene::render_engine_scene_to_video::command_args::RenderEngineSceneToVideoCommandArgs;
use crate::state::job_dependencies::JobDependencies;
use crate::util::downloaders::maybe_download_file_from_bucket::{maybe_download_file_from_bucket, MaybeDownloadArgs};

const BUCKET_FILE_EXTENSION : &str = ".mp4";
const BUCKET_FRAMES_FILE_EXTENSION : &str = ".zip";

pub struct BvhToWorkflowJobArgs<'a> {
  pub job_dependencies: &'a JobDependencies,
  pub job: &'a AvailableInferenceJob,
  pub media_file: &'a MediaFileForInference,
}

pub async fn process_job(args: BvhToWorkflowJobArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
  let job = args.job;
  let media_file = args.media_file;

  let mut job_progress_reporter = args.job_dependencies
      .clients
      .job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  let model_dependencies = args
      .job_dependencies
      .job
      .job_specific_dependencies
      .maybe_convert_bvh_to_workflow_dependencies
      .as_ref()
      .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("missing BvhToWorkflow dependencies".to_string())))?;

  // ==================== TEMP DIR ==================== //

  let work_temp_dir = format!("temp_file_convert_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = args.job_dependencies
      .fs
      .scoped_temp_dir_creator_for_work
      .new_tempdir(&work_temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  // ==================== DOWNLOAD MEDIA FILE ==================== //

  info!("Download media for conversion...");

  let asset_filename = get_asset_filename(&media_file)
      .ok_or(ProcessSingleJobError::Other(anyhow!("media_file has the wrong file type")))?;

  let original_media_upload_fs_path = {
    let original_media_file_fs_path = work_temp_dir.path().join(asset_filename);

    let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
      &media_file.public_bucket_directory_hash,
      media_file.maybe_public_bucket_prefix.as_deref(),
      media_file.maybe_public_bucket_extension.as_deref());

    let bucket_object_path = media_file_bucket_path.to_full_object_pathbuf();

    info!("Downloading media to bucket path: {:?} to filesystem path: {:?}",
      &bucket_object_path,
      &original_media_file_fs_path);

    maybe_download_file_from_bucket(MaybeDownloadArgs {
      name_or_description_of_file: "media upload (original file)",
      final_filesystem_file_path: &original_media_file_fs_path,
      bucket_object_path: &bucket_object_path,
      bucket_client: &args.job_dependencies.buckets.public_bucket_client,
      job_progress_reporter: &mut job_progress_reporter,
      job_progress_update_description: "downloading",
      job_id: job.id.0,
      scoped_tempdir_creator: &args.job_dependencies.fs.scoped_temp_dir_creator_for_work,
      maybe_existing_file_minimum_size_required: None,
    }).await?;

    original_media_file_fs_path
  };

  // ==================== SETUP FOR CONVERSION / HANDLE ARGS ==================== //

  job_progress_reporter.log_status("running conversion")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let maybe_args = job.maybe_inference_args
      .as_ref()
      .map(|args| args.args.as_ref())
      .flatten()
      .map(|args| match args {
        PolymorphicInferenceArgs::Es(args) => Some(args),
        _ => None,
      })
      .flatten();

  let mut maybe_camera = None;
  let mut maybe_camera_speed = None;
  let mut maybe_skybox = None;

  if let Some(engine_args) = maybe_args {
    maybe_camera = engine_args.camera_animation.clone();
    maybe_camera_speed = engine_args.camera_speed;
    maybe_skybox = engine_args.skybox.clone();
  }

  // ==================== RUN INFERENCE SCRIPT ==================== //

  let stderr_output_file = work_temp_dir.path().join("stderr.txt");
  let output_directory = work_temp_dir.path().join("output");
  let output_directory_actual = work_temp_dir.path();

  let execution_start_time = Instant::now();

  let command_exit_status = {
    model_dependencies
        .command_runner
        .run_with_subprocess(RunAsSubprocessArgs {
          args: Box::new(&RenderEngineSceneToVideoCommandArgs {
            input_file: &original_media_upload_fs_path,
            output_directory: &output_directory,
            maybe_camera: maybe_camera.as_deref(),
            maybe_camera_speed,
            maybe_skybox: maybe_skybox.as_deref(),
          }),
          //maybe_stderr_output_file: Some(FileOrCreate::NewFileWithName(&stderr_output_file)),
          // NB(bt,2024-02-29): Bevy's stdout goes to stderr, so we can't capture the semantics we want
          stderr: StreamRedirection::None,
          stdout: StreamRedirection::None,
        })
  };

  let execution_duration = Instant::now().duration_since(execution_start_time);

  info!("Execution took duration to complete: {:?}", &execution_duration);

  if !command_exit_status.is_success() {
    error!("Execution failed: {:?}", command_exit_status);

    let error = ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", command_exit_status));

    if let Ok(contents) = read_to_string(&stderr_output_file) {
      warn!("Captured stderr output: {}", contents);
    }

    safe_delete_file(&original_media_upload_fs_path);
    safe_delete_directory(&output_directory_actual);
    safe_delete_directory(&work_temp_dir);

    return Err(error);
  }

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  let output_video_file = output_directory_actual.join("output.mp4");
  let output_frames_zip_file = output_directory_actual.join("output.zip");
  // NB: The actual name of the file will be this:

  info!("Checking that output files exist...");

  check_file_exists(&output_video_file).map_err(|e| ProcessSingleJobError::Other(e))?;
  check_file_exists(&output_frames_zip_file).map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Interrogating result file properties...");

  let file_size_bytes = file_size(&output_video_file)
      .map_err(|err| ProcessSingleJobError::Other(err))?;

  let maybe_mimetype = get_mimetype_for_file(&output_video_file)
      .map_err(|err| ProcessSingleJobError::from_io_error(err))?
      .map(|mime| mime.to_string());

  info!("Calculating sha256...");

  let file_checksum = sha256_hash_file(&output_video_file)
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
      })?;

  // ==================== UPLOAD AUDIO TO BUCKET ==================== //

  job_progress_reporter.log_status("uploading result")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let result_video_bucket_location = MediaFileBucketPath::generate_new(
    None,
    Some(BUCKET_FILE_EXTENSION));

  let result_bucket_object_pathbuf = result_video_bucket_location.to_full_object_pathbuf();

  info!("Destination bucket path: {:?}", &result_bucket_object_pathbuf);

  info!("Uploading media file...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf,
    &output_video_file,
    "video/mp4")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let result_zip_bucket_location = MediaFileBucketPath::from_object_hash(&result_video_bucket_location.get_object_hash(),
    None,
    Some(".zip"));

  let result_bucket_object_pathbuf = result_zip_bucket_location.to_full_object_pathbuf();

  info!("Destination bucket path: {:?}", &result_bucket_object_pathbuf);

  info!("Uploading media file...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf,
    &output_frames_zip_file,
  "application/zip")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  safe_delete_file(&output_video_file);
  safe_delete_file(&output_frames_zip_file);
  safe_delete_directory(&output_directory_actual);

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_directory(&work_temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving record...");

  let (inference_result_token, id) = insert_media_file_generic_from_job(InsertFromJobArgs {
    pool: &args.job_dependencies.db.mysql_pool,
    job: &job,
    media_class: MediaFileClass::Video,
    media_type: MediaFileType::Video,
    origin_category: MediaFileOriginCategory::Processed,
    origin_product_category: MediaFileOriginProductCategory::Mocap,
    maybe_origin_model_type: None,
    maybe_origin_model_token: None,
    maybe_origin_filename: None,
    maybe_mime_type: maybe_mimetype.as_deref(),
    file_size_bytes,
    maybe_duration_millis: None,
    maybe_audio_encoding: None,
    maybe_video_encoding: None,
    maybe_frame_width: None,
    maybe_frame_height: None,
    public_bucket_directory_hash: result_video_bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: result_video_bucket_location.get_optional_prefix(),
    maybe_public_bucket_extension: result_video_bucket_location.get_optional_extension(),
    maybe_extra_media_info: None,
    maybe_creator_file_synthetic_id_category: IdCategory::MediaFile,
    maybe_creator_category_synthetic_id_category: IdCategory::MocapResult,
    maybe_mod_user_token: None,
    maybe_batch_token: None,
    maybe_prompt_token: None,
    is_generated_on_prem: false,
    checksum_sha2: &file_checksum,
    generated_by_worker: Some(&args.job_dependencies.job.info.container.hostname),
    generated_by_cluster: Some(&args.job_dependencies.job.info.container.cluster_name),
    maybe_title: None,
    maybe_text_transcript: None,
    maybe_scene_source_media_file_token: None, // TODO: The scene token should be available, but we might not revisit this job
    is_intermediate_system_file: false,
  })
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("VC Done.");

  //args.job_dependencies.clients.firehose_publisher.vc_inference_finished(
  //  maybe_user_token.as_ref(),
  //  &job.inference_job_token,
  //  inference_result_token.as_str())
  //    .await
  //    .map_err(|e| {
  //      error!("error publishing event: {:?}", e);
  //      ProcessSingleJobError::Other(anyhow!("error publishing event"))
  //    })?;

  job_progress_reporter.log_status("done")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Job {:?} complete success! Downloaded, executed successfully, and uploaded. Saved record: {}, Result Token: {}",
        job.id, id, &inference_result_token);

  Ok(JobSuccessResult {
    maybe_result_entity: Some(ResultEntity {
      entity_type: InferenceResultType::MediaFile,
      entity_token: inference_result_token.to_string(),
    }),
    inference_duration: execution_duration,
  })
}

/// Storyteller Engine uses the file extension to determine engine behavior,
/// so this is essential to map correctly.
fn get_asset_filename(media_file: &&MediaFileForInference) -> Option<&'static str> {
  match media_file.media_type {
    MediaFileType::Bvh => Some("original.bvh"),
    MediaFileType::Glb => Some("original.scn.gltf"), // TODO(bt): Is the extension "gltf" for "glb" ??
    MediaFileType::SceneRon => Some("original.scn.ron"),
    _ => None,
  }
}

#[derive(Deserialize, Default)]
struct FileMetadata {
  pub duration_millis: Option<u64>,
  pub mimetype: Option<String>,
  pub file_size_bytes: u64,
}
