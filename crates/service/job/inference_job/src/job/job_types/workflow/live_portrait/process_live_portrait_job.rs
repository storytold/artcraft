use std::collections::HashMap;
use std::fs::{File, read_to_string};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use anyhow::{anyhow, Result};
use log::{debug, error, info, warn};
use serde_json::Value;
use walkdir::WalkDir;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_bucket_details::RemoteCloudBucketDetails;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::prompts::prompt_type::PromptType;
use errors::AnyhowResult;
use filesys::check_file_exists::check_file_exists;
use filesys::file_exists::file_exists;
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use filesys::safe_delete_temp_directory::safe_delete_temp_directory;
use filesys::safe_delete_temp_file::safe_delete_temp_file;
use filesys::safe_recursively_delete_files::safe_recursively_delete_files;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs::Cu;
use mysql_queries::payloads::generic_inference_args::workflow_payload::NewValue;
use mysql_queries::payloads::prompt_args::encoded_style_transfer_name::EncodedStyleTransferName;
use mysql_queries::payloads::prompt_args::prompt_inner_payload::{PromptInnerPayload, PromptInnerPayloadBuilder};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::insert_media_file_from_comfy_ui::{insert_media_file_from_comfy_ui, InsertArgs};
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};
use thumbnail_generator::task_client::thumbnail_task::{ThumbnailTaskBuilder, ThumbnailTaskInputMimeType};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use videos::ffprobe_get_dimensions::ffprobe_get_dimensions;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::lipsync::sad_talker::categorize_error::categorize_error;
use crate::job::job_types::workflow::comfy_ui_inference_command::{InferenceArgs, InferenceDetails};
use crate::job::job_types::workflow::live_portrait::categorize_live_portrait_error::categorize_live_portrait_error;
use crate::job::job_types::workflow::live_portrait::command_args::LivePortraitCommandArgs;
use crate::job::job_types::workflow::live_portrait::extract_live_portrait_payload_from_job::extract_live_portrait_payload_from_job;
use crate::job::job_types::workflow::video_style_transfer::extract_vst_workflow_payload_from_job::extract_vst_workflow_payload_from_job;
use crate::job::job_types::workflow::video_style_transfer::steps::check_and_validate_job::check_and_validate_job;
use crate::job::job_types::workflow::video_style_transfer::steps::download_global_ipa_image::{download_global_ipa_image, DownloadGlobalIpaImageArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::download_input_videos::{download_input_videos, DownloadInputVideoArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::post_process_add_watermark::{post_process_add_watermark, PostProcessAddWatermarkArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::post_process_restore_audio::{post_process_restore_audio, PostProcessRestoreVideoArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::preprocess_save_audio::{preprocess_save_audio, ProcessSaveAudioArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::preprocess_trim_and_resample_videos::{preprocess_trim_and_resample_videos, ProcessTrimAndResampleVideoArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::validate_and_save_results::{SaveResultsArgs, validate_and_save_results};
use crate::job::job_types::workflow::video_style_transfer::util::comfy_dirs::ComfyDirs;
use crate::job::job_types::workflow::video_style_transfer::util::video_pathing::{PrimaryInputVideoAndPaths, SecondaryInputVideoAndPaths, VideoPathing};
use crate::job::job_types::workflow::video_style_transfer::util::write_workflow_prompt::{WorkflowPromptArgs, write_workflow_prompt};
use crate::state::job_dependencies::JobDependencies;
use crate::util::common_commands::ffmpeg_audio_replace_args::FfmpegAudioReplaceArgs;
use crate::util::common_commands::ffmpeg_logo_watermark_command::WatermarkArgs;
use crate::util::downloaders::download_media_file::{download_media_file, DownloadMediaFileArgs};

pub async fn process_live_portrait_job(
  deps: &JobDependencies,
  job: &AvailableInferenceJob,
) -> Result<JobSuccessResult, ProcessSingleJobError> {

  let mut job_progress_reporter = deps
      .clients
      .job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  let comfy_deps = deps
      .job
      .job_specific_dependencies
      .maybe_comfy_ui_dependencies
      .as_ref()
      .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("Missing ComfyUI dependencies".to_string())))?;

  let job_payload = extract_live_portrait_payload_from_job(&job)?;

  info!("Job payload: {:?}", job_payload);

  // ==================== TEMP DIR ==================== //

  let work_temp_dir = format!("temp_live_portrait_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = deps
      .fs
      .scoped_temp_dir_creator_for_work
      .new_tempdir(&work_temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let output_dir = work_temp_dir.path().join("output");
  let output_file_path = work_temp_dir.path().join("output.mp4");

  if !output_dir.exists() {
    std::fs::create_dir_all(&output_dir)
        .map_err(|err| ProcessSingleJobError::IoError(err))?;
  }

  // ===================== DOWNLOAD REQUIRED FILES ===================== //

  job_progress_reporter.log_status("downloading dependencies")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client().await;
  let remote_cloud_file_client = match remote_cloud_file_client {
    Ok(res) => res,
    Err(_) => {
      return Err(ProcessSingleJobError::from(anyhow!("failed to get remote cloud file client")));
    }
  };

  info!("Preparing to download portrait media file...");

  let portrait_media_token = job_payload.portrait_media_file_token.ok_or_else(|| anyhow!("no portrait media token"))?;
  let portrait_file_path = work_temp_dir.path().join("portrait.bin");

  let portrait = download_media_file(DownloadMediaFileArgs {
    mysql_pool: &deps.db.mysql_pool,
    remote_cloud_file_client: &remote_cloud_file_client,
    media_file_token: &portrait_media_token,
    can_see_deleted: true,
    download_path: &portrait_file_path,
  }).await?;

  info!("Preparing to download driver media file...");

  let driver_media_token = job_payload.driver_media_file_token.ok_or_else(|| anyhow!("no driver media token"))?;
  let driver_file_path = work_temp_dir.path().join("driver.bin");

  let driver = download_media_file(DownloadMediaFileArgs {
    mysql_pool: &deps.db.mysql_pool,
    remote_cloud_file_client: &remote_cloud_file_client,
    media_file_token: &driver_media_token,
    can_see_deleted: true,
    download_path: &driver_file_path,
  }).await?;

  let input_is_image = match portrait.media_file.media_type {
    MediaFileType::Image
    | MediaFileType::Jpg
    | MediaFileType::Png
    | MediaFileType::Gif => true,
    _ => false,
  };

  // ==================== RUN COMFY INFERENCE ==================== //

  info!("Preparing for ComfyUI inference...");

  job_progress_reporter.log_status("running inference")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let stderr_output_file = work_temp_dir.path().join("stderr.txt");
  let stdout_output_file = work_temp_dir.path().join("stdout.txt");

  let inference_start_time = Instant::now();

  info!("Running ComfyUI inference...");

  let command_exit_status = comfy_deps
      .inference_command
      // TODO(bt,2024-07-15): Move this to its own runner. Just hacking this quickly.
      .execute_live_portrait_inference(LivePortraitCommandArgs {
        portrait_file: &portrait_file_path,
        driver_file: &driver_file_path,
        tempdir: work_temp_dir.path(),
        output_file: &output_file_path,
        stderr_output_file: &stderr_output_file,
        stdout_output_file: &stdout_output_file,
        input_is_image,
      }).await;

  let inference_duration = Instant::now().duration_since(inference_start_time);

  info!("Inference command exited with status: {:?}", command_exit_status);

  info!("Inference took duration to complete: {:?}", &inference_duration);

  // check stdout for success and check if file exists
  if let Ok(contents) = read_to_string(&stdout_output_file) {
    info!("Captured stduout output: {}", contents);
  }

  if let Ok(contents) = read_to_string(&stderr_output_file) {
    info!("Captured stderr output: {}", contents);
  }

  if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&output_file_path) {
    info!("Comfy output video dimensions: {}x{}", dimensions.width, dimensions.height);
  }

  // ==================== CHECK STATUS ======================== //

  // if !command_exit_status.is_success() {
  //   error!("Inference failed: {:?}", command_exit_status);
  // }

  // ==================== CHECK OUTPUT FILE ======================== //

  if let Err(err) = check_file_exists(&output_file_path) {
    error!("Output file does not  exist: {:?}", err);
    error!("Inference failed with exit status: {:?}", command_exit_status);

    print_and_detect_stderr_issues(&stderr_output_file)?;
    print_and_detect_stderr_issues(&stdout_output_file)?;

    safe_delete_temp_file(&stderr_output_file);
    safe_delete_temp_file(&stdout_output_file);
    safe_delete_temp_directory(&work_temp_dir);

    return Err(ProcessSingleJobError::Other(anyhow!("Output file did not exist: {:?}",
            &output_file_path)));
  }

//  // ==================== COPY BACK AUDIO ==================== //
//
//  post_process_restore_audio(PostProcessRestoreVideoArgs {
//    comfy_deps,
//    videos: &mut videos,
//  });
//
//  // ==================== OPTIONAL WATERMARK ==================== //
//
//  post_process_add_watermark(PostProcessAddWatermarkArgs {
//    comfy_deps,
//    videos: &mut videos,
//  });


  // ==================== VALIDATE AND SAVE RESULTS ======================== //

  //let media_file_token = validate_and_save_results(SaveResultsArgs {
  //  job,
  //  deps: &deps,
  //  job_args: &job_args,
  //  comfy_deps,
  //  comfy_args,
  //  videos: &videos,
  //  job_progress_reporter: &mut job_progress_reporter,
  //  inference_duration,
  //}).await?;

  // TODO(bt,2024-07-16): Clean all of this up.

  const PREFIX: &str = "storyteller_";
  let ext_suffix = ".mp4";

  let result_bucket_location = MediaFileBucketPath::generate_new(
    Some(&PREFIX),
    Some(&ext_suffix));

  let file_checksum = sha256_hash_file(&output_file_path)
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
      })?;

  let file_size_bytes = file_size(&output_file_path)
      .map_err(|err| ProcessSingleJobError::Other(err))?;

  let mimetype = get_mimetype_for_file(&output_file_path)
      .map_err(|err| ProcessSingleJobError::from_io_error(err))?
      .map(|mime| mime.to_string())
      .ok_or(ProcessSingleJobError::Other(anyhow!("Mimetype could not be determined")))?;

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  info!("Output file destination bucket path: {:?}", &result_bucket_object_pathbuf);

  info!("Uploading media ...");

  deps.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf,
    &output_file_path,
    &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let (media_file_token, id) = insert_media_file_from_comfy_ui(InsertArgs {
    pool: &deps.db.mysql_pool,
    job: &job,
    maybe_product_category: Some(MediaFileOriginProductCategory::FaceMirror), // Live Portrait named "Face Mirror" on the site
    maybe_model_type: Some(MediaFileOriginModelType::LivePortrait),
    maybe_mime_type: Some(&mimetype),
    maybe_title: None,
    maybe_style_transfer_source_media_file_token: Some(&portrait_media_token),
    maybe_scene_source_media_file_token: None,
    file_size_bytes,
    sha256_checksum: &file_checksum,
    maybe_prompt_token: None,
    public_bucket_directory_hash: result_bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: Some(PREFIX),
    maybe_public_bucket_extension: Some(&ext_suffix),
    is_on_prem: deps.job.info.container.is_on_prem,
    worker_hostname: &deps.job.info.container.hostname,
    worker_cluster: &deps.job.info.container.cluster_name,
    extra_file_modification_info: None,
  })
      .await
      .map_err(|e| {
        error!("Error saving media file record: {:?}", e);
        ProcessSingleJobError::Other(e)
      })?;


  // ==================== (OPTIONAL) DEBUG SLEEP ==================== //

  if let Some(sleep_millis) = job_payload.sleep_millis {
    info!("Sleeping for millis: {sleep_millis}");
    thread::sleep(Duration::from_millis(sleep_millis));
  }

  // ==================== GENERATE THUMBNAILS ==================== //

  let thumbnail_task_result = ThumbnailTaskBuilder::new_for_source_mimetype(ThumbnailTaskInputMimeType::MP4)
    .with_bucket(&*deps.buckets.public_bucket_client.bucket_name())
    .with_path(&*path_to_string(result_bucket_object_pathbuf.clone()))
    .with_output_suffix("thumb")
    .with_event_id(&job.id.0.to_string())
    .send_all()
    .await;

  match thumbnail_task_result {
    Ok(thumbnail_task) => {
      debug!("Thumbnail tasks sent: {:?}", thumbnail_task);
    },
    Err(e) => {
      error!("Failed to create some/all thumbnail tasks: {:?}", e);
    }
  }

  // ==================== CLEANUP/ DELETE TEMP FILES ==================== //

  info!("Cleaning up temporary files...");

  safe_delete_temp_file(&driver_file_path);
  safe_delete_temp_file(&portrait_file_path);

  safe_recursively_delete_files(&output_dir);
  safe_delete_temp_directory(&work_temp_dir);

  // ==================== DONE ==================== //

  info!("Work Done.");

  job_progress_reporter.log_status("done")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Result media token: {:?}", &media_file_token);

  info!("Job {:?} complete success!", job.id);

  Ok(JobSuccessResult {
    maybe_result_entity: Some(ResultEntity {
      entity_type: InferenceResultType::MediaFile,
      entity_token: media_file_token.to_string(),
    }),
    inference_duration,
  })
}

fn print_and_detect_stderr_issues(stderr_output_file: &Path) -> Result<(), ProcessSingleJobError> {
  let contents = match read_to_string(stderr_output_file) {
    Ok(contents) => {
      warn!("Captured stderr output: {}", contents);
      contents
    },
    Err(err) => {
      error!("Error reading stderr output: {:?}", err);
      return Ok(());
    }
  };

  match categorize_live_portrait_error(&contents) {
    Some(ProcessSingleJobError::FaceDetectionFailure) => {
      warn!("Face not detected in source");
      Err(ProcessSingleJobError::FaceDetectionFailure)
    }
    _ => Ok(())
  }
}
