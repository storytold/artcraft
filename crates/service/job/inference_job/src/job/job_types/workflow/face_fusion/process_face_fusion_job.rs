use std::fs::read_to_string;
use std::path::Path;
use std::thread;
use std::time::{Duration, Instant};

use anyhow::{anyhow, Result};
use log::{debug, error, info, warn};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_type::MediaFileType;
use filesys::check_file_exists::check_file_exists;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use filesys::file_deletion::safe_recursively_delete_files::safe_recursively_delete_files;
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::payloads::generic_inference_args::common::watermark_type::WatermarkType;
use mysql_queries::payloads::media_file_extra_info::inner_payloads::face_fusion_video_extra_info::FaceFusionVideoExtraInfo;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::insert_media_file_from_face_fusion::{insert_media_file_from_face_fusion, InsertFaceFusionArgs};
use thumbnail_generator::task_client::thumbnail_task::{ThumbnailTaskBuilder, ThumbnailTaskInputMimeType};
use videos::ffprobe_get_info::ffprobe_get_info;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::face_fusion::categorize_face_fusion_error::categorize_face_fusion_error;
use crate::job::job_types::workflow::face_fusion::command_args::FaceFusionCommandArgs;
use crate::job::job_types::workflow::face_fusion::extract_face_fusion_payload_from_job::extract_face_fusion_payload_from_job;
use crate::job::job_types::workflow::face_fusion::face_fusion_title::face_fusion_title;
use crate::state::job_dependencies::JobDependencies;
use crate::util::common_commands::ffmpeg::old::ffmpeg_logo_watermark_command::WatermarkArgs;
use crate::util::downloaders::download_media_file::{download_media_file, DownloadMediaFileArgs};

pub async fn process_face_fusion_job(
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

  let job_payload = extract_face_fusion_payload_from_job(&job)?;

  info!("Job payload: {:?}", job_payload);

  // ==================== TEMP DIR ==================== //

  let work_temp_dir = format!("temp_face_fusion_{}", job.id.0);

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

  info!("Preparing to download audio media file...");

  let audio_media_token = job_payload.audio_media_file_token.ok_or_else(|| anyhow!("no audio media token"))?;
  let audio_file_path = work_temp_dir.path().join("audio.bin");

  let audio = download_media_file(DownloadMediaFileArgs {
    mysql_pool: &deps.db.mysql_pool,
    remote_cloud_file_client: &remote_cloud_file_client,
    media_file_token: &audio_media_token,
    can_see_deleted: true,
    download_path: &audio_file_path,
  }).await?;

  info!("Preparing to download image or video media file...");

  let image_or_video_media_token = job_payload.image_or_video_media_file_token.ok_or_else(|| anyhow!("no image or video media token"))?;
  let image_or_video_file_path = work_temp_dir.path().join("image_or_video.bin");

  let image_or_video = download_media_file(DownloadMediaFileArgs {
    mysql_pool: &deps.db.mysql_pool,
    remote_cloud_file_client: &remote_cloud_file_client,
    media_file_token: &image_or_video_media_token,
    can_see_deleted: true,
    download_path: &image_or_video_file_path,
  }).await?;

  let input_is_image = match audio.media_file.media_type {
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
      .execute_face_fusion_inference(FaceFusionCommandArgs {
        audio_file: &audio_file_path,
        image_or_video_file: &image_or_video_file_path,
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

    safe_delete_file(&stderr_output_file);
    safe_delete_file(&stdout_output_file);
    safe_delete_directory(&work_temp_dir);

    return Err(ProcessSingleJobError::Other(anyhow!("Output file did not exist: {:?}",
            &output_file_path)));
  }

  // ==================== OPTIONAL WATERMARK ======================== //

  let mut final_video_path = output_file_path.clone();

  let maybe_watermark_details = match job_payload.watermark_type {
    Some(WatermarkType::FakeYou) => Some(&comfy_deps.watermarks.fakeyou),
    Some(WatermarkType::Storyteller) => Some(&comfy_deps.watermarks.storyteller),
    _ => None,
  };

  if let Some(watermark_details) = maybe_watermark_details {
    info!("Adding watermark to video...");

    let watermark_output_file = work_temp_dir.path().join("watermark.mp4");

    let watermark_command_exit_status = comfy_deps
        .ffmpeg_watermark_command
        .execute(WatermarkArgs {
          video_path: &output_file_path,
          maybe_override_logo_path: Some(&watermark_details.path),
          alpha: watermark_details.alpha,
          scale: watermark_details.scale,
          output_path: &watermark_output_file,
        });

    match check_file_exists(&watermark_output_file) {
      Err(err) => error!("Watermarking failed to produce file: {:?}", err),
      Ok(()) => {
        if watermark_command_exit_status.is_success() {
          final_video_path = watermark_output_file;
        } else {
          error!("Watermarking failed: {:?}", watermark_command_exit_status);
        }
      }
    }
  }

  // ==================== INSPECT VIDEO ======================== //

  let maybe_ffprobe_info = match ffprobe_get_info(&final_video_path) {
    Ok(info) => Some(info),
    Err(err) => {
      error!("Error reading video info with ffprobe: {:?}", err);
      None // NB: Fail open instead of failing the job on ffprobe errors.
    }
  };

  if let Some(info) = &maybe_ffprobe_info {
    if let Some(dimensions) = info.dimensions.as_ref() {
      info!("Comfy output video dimensions: {}x{}", dimensions.width, dimensions.height);
    }
    if let Some(duration) = info.duration.as_ref() {
      info!("Comfy output duration seconds: {}", &duration.seconds_original);
    }
  }

  // ==================== OTHER FILE METADATA ==================== //

  let mut maybe_duration_millis = None;
  let mut maybe_frame_width = None;
  let mut maybe_frame_height = None;

  if let Some(video_info) = maybe_ffprobe_info {
    maybe_duration_millis = video_info.duration
        .map(|duration| duration.millis as u64);

    maybe_frame_width = video_info.dimensions
        .as_ref()
        .map(|dimensions| dimensions.width as u32);

    maybe_frame_height = video_info.dimensions
        .as_ref()
        .map(|dimensions| dimensions.height as u32);
  }

  let file_checksum = sha256_hash_file(&final_video_path)
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
      })?;

  let file_size_bytes = file_size(&final_video_path)
      .map_err(|err| ProcessSingleJobError::Other(err))?;

  let mimetype = get_mimetype_for_file(&final_video_path)
      .map_err(|err| ProcessSingleJobError::from_io_error(err))?
      .map(|mime| mime.to_string())
      .ok_or(ProcessSingleJobError::Other(anyhow!("Mimetype could not be determined")))?;

  let model_title = audio.media_file.maybe_model_weights_title.as_deref();
  let audio_title = audio.media_file.maybe_title.as_deref();
  let image_or_video_title = image_or_video.media_file.maybe_title.as_deref();
  let result_video_title = face_fusion_title(model_title, audio_title, image_or_video_title);

  // ==================== UPLOAD AND SAVE ==================== //

  const PREFIX: &str = "storyteller_";
  const EXT_SUFFIX: &str = ".mp4";

  let result_bucket_location = MediaFileBucketPath::generate_new(
    Some(PREFIX),
    Some(EXT_SUFFIX));

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  info!("Output file destination bucket path: {:?}", &result_bucket_object_pathbuf);

  info!("Uploading media ...");

  deps.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf,
    &final_video_path,
    &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let face_fusion_video_info = FaceFusionVideoExtraInfo {
    maybe_audio_media_token: Some(audio.media_file.token.clone()),
    image_or_video_media_token: Some(image_or_video.media_file.token.clone()),
  };

  let media_file_token = insert_media_file_from_face_fusion(InsertFaceFusionArgs {
    pool: &deps.db.mysql_pool,
    job: &job,
    face_fusion_video_info: &face_fusion_video_info,
    media_type: MediaFileType::Mp4,
    maybe_mime_type: Some(&mimetype),
    maybe_audio_encoding: None, // TODO
    maybe_video_encoding: None, // TODO
    maybe_frame_width,
    maybe_frame_height,
    maybe_title: Some(&result_video_title),
    file_size_bytes,
    maybe_duration_millis,
    sha256_checksum: &file_checksum,
    public_bucket_directory_hash: result_bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: Some(PREFIX),
    maybe_public_bucket_extension: Some(EXT_SUFFIX),
    is_on_prem: deps.job.info.container.is_on_prem,
    worker_hostname: &deps.job.info.container.hostname,
    worker_cluster: &deps.job.info.container.cluster_name,
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

  safe_delete_file(&image_or_video_file_path);
  safe_delete_file(&audio_file_path);

  safe_recursively_delete_files(&output_dir);
  safe_delete_directory(&work_temp_dir);

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

  match categorize_face_fusion_error(&contents) {
    Some(ProcessSingleJobError::FaceDetectionFailure) => {
      warn!("Face not detected in source");
      Err(ProcessSingleJobError::FaceDetectionFailure)
    }
    _ => Ok(())
  }
}
