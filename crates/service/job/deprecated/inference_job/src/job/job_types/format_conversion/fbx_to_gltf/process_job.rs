use std::fs::read_to_string;
use std::path::PathBuf;
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
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporter;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::generic_insert::insert_media_file_generic_from_job::{insert_media_file_generic_from_job, InsertFromJobArgs};
use mysql_queries::queries::media_files::get::get_media_file_for_inference::MediaFileForInference;
use subprocess_common::command_runner::command_runner_args::{FileOrCreate, RunAsSubprocessArgs, StreamRedirection};

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::format_conversion::fbx_to_gltf::command_args::FbxToGltfCommandArgs;
use crate::state::job_dependencies::JobDependencies;
use crate::util::downloaders::maybe_download_file_from_bucket::{maybe_download_file_from_bucket, MaybeDownloadArgs};

// Flag to control GLB vs GLTF uploading
const UPLOAD_AS_GLB : bool = true;

// GLTF is two files - one json, one binary
const BUCKET_GLTF_FILE_EXTENSION: &str = ".gltf";
const BUFFER_BIN_FILE_EXTENSION : &str = ".bin";

// GLB is one binary file
const BUCKET_GLB_FILE_EXTENSION: &str = ".glb";

pub struct FbxToGltfJobArgs<'a> {
  pub job_dependencies: &'a JobDependencies,
  pub job: &'a AvailableInferenceJob,
  pub media_file: &'a MediaFileForInference,
}

//noinspection RsConstantConditionIf
pub async fn process_job(args: FbxToGltfJobArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
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
      .maybe_convert_fbx_to_gltf_dependencies
      .as_ref()
      .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("missing ConvertFbx2Gltf dependencies".to_string())))?;

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

  let original_media_upload_fs_path = {
    let original_media_file_fs_path = work_temp_dir.path().join("original.fbx");

    let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
          &media_file.public_bucket_directory_hash,
          media_file.maybe_public_bucket_prefix.as_deref(),
          media_file.maybe_public_bucket_extension.as_deref());

    let bucket_object_path = media_file_bucket_path.to_full_object_pathbuf();

    info!("Downloading media to bucket path: {:?}", &bucket_object_path);

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

  // ==================== SETUP FOR CONVERSION ==================== //

  job_progress_reporter.log_status("running conversion")
      .map_err(|e| ProcessSingleJobError::Other(e))?;


  // ==================== RUN INFERENCE SCRIPT ==================== //

  let stderr_output_file = work_temp_dir.path().join("stderr.txt");
  let output_directory = work_temp_dir.path().join("output");

  // NB: gltf gets put into a subdirectory with a name based on the passed argument, whereas glb gets dropped into
  // the same directory
  let output_directory_actual = match UPLOAD_AS_GLB {
    true => work_temp_dir.path().to_path_buf(),
    false => work_temp_dir.path().join("output_out"),
  };

  let execution_start_time = Instant::now();

  let command_exit_status = {
    model_dependencies
        .command_runner
        .run_with_subprocess(RunAsSubprocessArgs {
          args: Box::new(&FbxToGltfCommandArgs {
            input_file: &original_media_upload_fs_path,
            output_directory: &output_directory,
            binary: true,
          }),
          stderr: StreamRedirection::File(FileOrCreate::NewFileWithName(&stderr_output_file)),
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

      //match categorize_error(&contents)  {
      //  Some(ProcessSingleJobError::FaceDetectionFailure) => {
      //    warn!("Face not detected in source image");
      //    error = ProcessSingleJobError::FaceDetectionFailure;
      //  }
      //  _ => {}
      //}
    }

    safe_delete_file(&original_media_upload_fs_path);
    safe_delete_directory(&output_directory_actual);
    safe_delete_directory(&work_temp_dir);

    return Err(error);
  }

  let upload_details = if UPLOAD_AS_GLB {
    validate_and_upload_glb(&args, &mut job_progress_reporter, &output_directory_actual).await?
  } else {
    validate_and_upload_gltf(&args, &mut job_progress_reporter, &output_directory_actual).await?
  };

  // ==================== CLEANUP FILES ==================== //

  safe_delete_directory(&output_directory_actual);
  safe_delete_directory(&work_temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving record (only gltf or glb, not the buffer.bin) ...");

  let (inference_result_token, id) = insert_media_file_generic_from_job(InsertFromJobArgs {
    pool: &args.job_dependencies.db.mysql_pool,
    job: &job,
    media_class: MediaFileClass::Dimensional,
    media_type: upload_details.media_type,
    origin_category: MediaFileOriginCategory::Processed,
    origin_product_category: MediaFileOriginProductCategory::Mocap,
    maybe_origin_model_type: None,
    maybe_origin_model_token: None,
    maybe_origin_filename: None,
    maybe_mime_type: upload_details.maybe_mimetype.as_deref(),
    file_size_bytes: upload_details.size_bytes,
    maybe_duration_millis: None,
    maybe_audio_encoding: None,
    maybe_video_encoding: None,
    maybe_frame_width: None,
    maybe_frame_height: None,
    public_bucket_directory_hash: upload_details.bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: upload_details.bucket_location.get_optional_prefix(),
    maybe_public_bucket_extension: upload_details.bucket_location.get_optional_extension(),
    maybe_extra_media_info: None,
    maybe_creator_file_synthetic_id_category: IdCategory::MediaFile,
    maybe_creator_category_synthetic_id_category: IdCategory::MocapResult,
    maybe_mod_user_token: None,
    maybe_batch_token: None,
    maybe_prompt_token: None,
    is_generated_on_prem: false,
    checksum_sha2: &upload_details.checksum,
    generated_by_worker: Some(&args.job_dependencies.job.info.container.hostname),
    generated_by_cluster: Some(&args.job_dependencies.job.info.container.cluster_name),
    maybe_text_transcript: None,
    maybe_title: None,
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false,
  })
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Fbx2Gltf Done.");

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

struct UploadDetails {
  media_type: MediaFileType,
  size_bytes: u64,
  maybe_mimetype: Option<String>,
  checksum: String,
  bucket_location: MediaFileBucketPath,
}


async fn validate_and_upload_glb(args: &FbxToGltfJobArgs<'_>, job_progress_reporter: &mut Box<dyn JobProgressReporter>,
                                  output_directory_actual: &PathBuf) -> Result<UploadDetails, ProcessSingleJobError>
{
  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  // NB: FBX2GLTF creates multiple files in the directory
  // NB: The actual name of the file will be these:
  let output_file = output_directory_actual.join("output.glb");

  info!("Checking that output files exist...");

  check_file_exists(&output_file).map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Interrogating result file properties...");

  let file_size_bytes = file_size(&output_file)
      .map_err(|err| ProcessSingleJobError::Other(err))?;

  let maybe_mimetype = get_mimetype_for_file(&output_file)
      .map_err(|err| ProcessSingleJobError::from_io_error(err))?
      .map(|mime| mime.to_string());

  info!("Calculating sha256...");

  let file_checksum = sha256_hash_file(&output_file)
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
      })?;

  // ==================== UPLOAD GLB TO BUCKET ==================== //

  job_progress_reporter.log_status("uploading output.glb")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let bucket_location = MediaFileBucketPath::generate_new(
    None,
    Some(BUCKET_GLTF_FILE_EXTENSION));

  let bucket_object_pathbuf = bucket_location.to_full_object_pathbuf();

  info!("Destination bucket path: {:?}", &bucket_object_pathbuf);

  info!("Uploading...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &bucket_object_pathbuf,
    &output_file,
    "model/gltf+binary")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // Cleanup
  safe_delete_file(&output_file);

  Ok(UploadDetails {
    media_type: MediaFileType::Glb,
    size_bytes: file_size_bytes,
    maybe_mimetype,
    checksum: file_checksum,
    bucket_location,
  })
}

async fn validate_and_upload_gltf(args: &FbxToGltfJobArgs<'_>, job_progress_reporter: &mut Box<dyn JobProgressReporter>,
                                  output_directory_actual: &PathBuf) -> Result<UploadDetails, ProcessSingleJobError>
{
  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  // NB: FBX2GLTF creates multiple files in the directory
  // NB: The actual name of the file will be these:
  let output_gltf_file = output_directory_actual.join("output.gltf");
  let output_buffer_file = output_directory_actual.join("buffer.bin");

  info!("Checking that output files exist...");

  check_file_exists(&output_gltf_file).map_err(|e| ProcessSingleJobError::Other(e))?;
  check_file_exists(&output_buffer_file).map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Interrogating result file properties...");

  let gltf_file_size_bytes = file_size(&output_gltf_file)
      .map_err(|err| ProcessSingleJobError::Other(err))?;

  let maybe_gltf_mimetype = get_mimetype_for_file(&output_gltf_file)
      .map_err(|err| ProcessSingleJobError::from_io_error(err))?
      .map(|mime| mime.to_string());

  info!("Calculating sha256...");

  let gltf_file_checksum = sha256_hash_file(&output_gltf_file)
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
      })?;

  // ==================== UPLOAD GLTF TO BUCKET ==================== //

  job_progress_reporter.log_status("uploading output.gltf")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let result_gtlf_bucket_location = MediaFileBucketPath::generate_new(
    None,
    Some(BUCKET_GLTF_FILE_EXTENSION));

  let result_gltf_bucket_object_pathbuf = result_gtlf_bucket_location.to_full_object_pathbuf();

  info!("Destination bucket path: {:?}", &result_gltf_bucket_object_pathbuf);

  info!("Uploading...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_gltf_bucket_object_pathbuf,
    &output_gltf_file,
    "model/gltf+json")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // ==================== UPLOAD BIN TO BUCKET ==================== //

  job_progress_reporter.log_status("uploading buffer.bin")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // NB: Reuse same object hash, just change the extension.
  let result_buffer_bucket_location = MediaFileBucketPath::from_object_hash(
    result_gtlf_bucket_location.get_object_hash(),
    None,
    Some(BUFFER_BIN_FILE_EXTENSION));

  let result_buffer_bucket_object_pathbuf = result_buffer_bucket_location.to_full_object_pathbuf();

  info!("Destination bucket path: {:?}", &result_buffer_bucket_object_pathbuf);

  info!("Uploading...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_buffer_bucket_object_pathbuf,
    &output_buffer_file,
    "application/octet-stream")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // Cleanup
  safe_delete_file(&output_buffer_file);
  safe_delete_file(&output_gltf_file);

  Ok(UploadDetails {
    media_type: MediaFileType::Gltf,
    size_bytes: gltf_file_size_bytes,
    maybe_mimetype: maybe_gltf_mimetype,
    checksum: gltf_file_checksum,
    bucket_location: result_gtlf_bucket_location,
  })
}
