use std::fs::read_to_string;
use std::time::Instant;

use anyhow::anyhow;
use log::{debug, error, info, warn};

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use filesys::check_file_exists::check_file_exists;
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use filesys::safe_delete_temp_directory::safe_delete_temp_directory;
use filesys::safe_delete_temp_file::safe_delete_temp_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::insert_media_file_from_face_animation::{insert_media_file_from_face_animation, InsertArgs};
use thumbnail_generator::task_client::thumbnail_task::{ThumbnailTaskBuilder, ThumbnailTaskInputMimeType};
use tokens::tokens::users::UserToken;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::lipsync::sad_talker::categorize_error::categorize_error;
use crate::job::job_types::lipsync::sad_talker::download_audio_file::{download_audio_file, DownloadAudioFileArgs};
use crate::job::job_types::lipsync::sad_talker::download_image_file::{download_image_file, DownloadImageFileArgs};
use crate::job::job_types::lipsync::sad_talker::resize_image::resize_image;
use crate::job::job_types::lipsync::sad_talker::sad_talker_inference_command::InferenceArgs;
use crate::job::job_types::lipsync::sad_talker::validate_job::validate_job;
use crate::state::job_dependencies::JobDependencies;
use crate::util::common_commands::ffmpeg_logo_watermark_command::WatermarkArgs;

/// The maximum that either width or height can be
const MAX_DIMENSION : u32 = 1500;

const BUCKET_FILE_PREFIX: &str = "fakeyou_";
const BUCKET_FILE_EXTENSION: &str = ".mp4";

pub struct SadTalkerProcessJobArgs<'a> {
  pub job_dependencies: &'a JobDependencies,
  pub job: &'a AvailableInferenceJob,
}

pub async fn process_job(args: SadTalkerProcessJobArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
  let job = args.job;
  let deps = args.job_dependencies;

  let mut job_progress_reporter = args.job_dependencies
      .clients
      .job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  let model_dependencies = args
      .job_dependencies
      .job
      .job_specific_dependencies
      .maybe_sad_talker_dependencies
      .as_ref()
      .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("missing SadTalker dependencies".to_string())))?;

  // ==================== UNPACK + VALIDATE INFERENCE ARGS ==================== //

  let job_args = validate_job(job)?;

  // ==================== CONFIRM OR DOWNLOAD SAD TALKER MODELS (SEVERAL) ==================== //

  info!("Download models (if not present)...");

  let mut i : usize = 0;

  for downloader in model_dependencies.downloaders.all_downloaders() {

    // Temporary debugging
    info!("Downloader {}", i);
    i = i + 1;

    let result = downloader.download_if_not_on_filesystem(
      &args.job_dependencies.buckets.private_bucket_client,
      &args.job_dependencies.fs.scoped_temp_dir_creator_for_short_lived_downloads,
    ).await;

    if let Err(err) = result {
      error!("could not download: {:?}", err);
      return Err(err);
    }
  }

  // ==================== TEMP DIR ==================== //

  let work_temp_dir = format!("temp_sad_talker_inference_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = args.job_dependencies
      .fs
      .scoped_temp_dir_creator_for_work
      .new_tempdir(&work_temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

 
  // ==================== QUERY AND DOWNLOAD FILES ==================== //

  let audio_path = download_audio_file(DownloadAudioFileArgs {
    audio_source: &job_args.audio_source,
    public_bucket_client: &args.job_dependencies.buckets.public_bucket_client,
    job_progress_reporter: &mut job_progress_reporter,
    job,
    temp_dir_creator: &args.job_dependencies.fs.scoped_temp_dir_creator_for_work,
    work_temp_dir: &work_temp_dir,
    mysql_pool: &deps.db.mysql_pool
  }).await?;

  info!("Downloaded audio file: {:?}", audio_path.filesystem_path);

  let image_path = download_image_file(DownloadImageFileArgs {
    image_source: &job_args.image_source,
    public_bucket_client: &args.job_dependencies.buckets.public_bucket_client,
    job_progress_reporter: &mut job_progress_reporter,
    job,
    temp_dir_creator: &args.job_dependencies.fs.scoped_temp_dir_creator_for_work,
    work_temp_dir: &work_temp_dir,
    mysql_pool: &deps.db.mysql_pool
  }).await?;

  info!("Downloaded image file: {:?}", image_path.filesystem_path);

  // ==================== TRANSCODE MEDIA (IF NECESSARY) ==================== //

  let mut usable_image_path = image_path.filesystem_path.clone();

  if let Some((width, height)) = job_args.width.zip(job_args.height) {
    info!("Requested image resize to {}x{} ...", width, height);

    let mut width = width.min(MAX_DIMENSION);
    let mut height = height.min(MAX_DIMENSION);

    if job_args.enhancer.is_some() {
      // The enhancer will double the size of the image, so we'll downsize the image by half
      // if it's enabled.
      width = width / 2;
      height = height / 2;
      info!("Enhancer will be doubling image size, so cutting frame size to {}x{}.", width, height)
    }

    info!("Resizing image to {}x{} ...", width, height);

    let result = resize_image(
      &image_path.filesystem_path,
      &work_temp_dir,
      width,
      height
    );

    match result {
      Err(err) => {
        error!("Image resize failure: {:?}", err);
        safe_delete_temp_file(&audio_path.filesystem_path);
        safe_delete_temp_file(&image_path.filesystem_path);
        safe_delete_temp_directory(&work_temp_dir);
        return Err(ProcessSingleJobError::Other(anyhow!("image resize failure: {:?}", err)));
      }
      Ok(resized_image_path) => {
        usable_image_path = resized_image_path;
      }
    }
  }

  info!("Used image file: {:?}", usable_image_path);

  // ==================== SETUP FOR INFERENCE ==================== //

  info!("Ready for SadTalker inference...");

  job_progress_reporter.log_status("running inference")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let output_video_fs_path = work_temp_dir.path().join("output.mp4");
  let output_video_fs_path_watermark = work_temp_dir.path().join("output_watermark.mp4");

  info!("Running SadTalker inference...");

  info!("Expected output video filename: {:?}", &output_video_fs_path);

  // TODO: Limit output length for non-premium (???)

  let _maybe_args = job.maybe_inference_args
      .as_ref()
      .map(|args| args.args.as_ref())
      .flatten();

  // ==================== RUN INFERENCE SCRIPT ==================== //

  let workdir = work_temp_dir.path().to_path_buf();
  let stderr_output_file = work_temp_dir.path().join("stderr.txt");
  let inference_start_time = Instant::now();

  let command_exit_status = model_dependencies
      .inference_command
      .execute_inference(InferenceArgs {
        input_audio: &audio_path.filesystem_path,
        input_image: &usable_image_path,
        work_dir: &workdir,
        output_file: &output_video_fs_path,
        stderr_output_file: &stderr_output_file,
        make_still: job_args.make_still,
        maybe_enhancer: job_args.enhancer.as_deref(),
        maybe_preprocess: job_args.preprocess.as_deref(),
      });

  let inference_duration = Instant::now().duration_since(inference_start_time);

  info!("Inference took duration to complete: {:?}", &inference_duration);

  if !command_exit_status.is_success() {
    error!("Inference failed: {:?}", command_exit_status);

    let mut error = ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", command_exit_status));

    if let Ok(contents) = read_to_string(&stderr_output_file) {
      warn!("Captured stderr output: {}", contents);

      match categorize_error(&contents)  {
        Some(ProcessSingleJobError::FaceDetectionFailure) => {
          warn!("Face not detected in source image");
          error = ProcessSingleJobError::FaceDetectionFailure;
        }
        _ => {}
      }
    }

    safe_delete_temp_file(&audio_path.filesystem_path);
    safe_delete_temp_file(&image_path.filesystem_path);
    safe_delete_temp_file(&usable_image_path);
    safe_delete_temp_file(&output_video_fs_path);
    safe_delete_temp_file(&stderr_output_file);
    safe_delete_temp_directory(&work_temp_dir);

    return Err(error);
  }

  // ==================== CHECK NON-WATERMARKED RESULT ==================== //

  info!("Checking that output file exists: {:?} ...", output_video_fs_path);

  check_file_exists(&output_video_fs_path).map_err(|e| ProcessSingleJobError::Other(e))?;

  // ==================== OPTIONAL WATERMARK ==================== //

  let mut finished_file = output_video_fs_path.clone();

  if !job_args.remove_watermark {
    info!("Adding watermark...");

    finished_file = output_video_fs_path_watermark.clone();

    let command_exit_status = model_dependencies
        .ffmpeg_watermark_command
        .execute(WatermarkArgs {
          video_path: &output_video_fs_path,
          maybe_override_logo_path: None,
          alpha: 0.6,
          scale: 0.1, // NB: 0.1 is good for the Storyteller logo @ 2653x512 placed on 1024x576 output.
          output_path: &output_video_fs_path_watermark,
        });

    if !command_exit_status.is_success() {
      error!("Watermark failed: {:?}", command_exit_status);
      safe_delete_temp_file(&audio_path.filesystem_path);
      safe_delete_temp_file(&image_path.filesystem_path);
      safe_delete_temp_file(&usable_image_path);
      safe_delete_temp_file(&output_video_fs_path);
      safe_delete_temp_file(&output_video_fs_path_watermark);
      safe_delete_temp_directory(&work_temp_dir);
      return Err(ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", command_exit_status)));
    }
  }

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output watermark file exists: {:?} ...", finished_file);
  check_file_exists(&finished_file).map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Interrogating result file size ...");

  let file_size_bytes = file_size(&finished_file)
      .map_err(|err| ProcessSingleJobError::Other(err))?;

  info!("Interrogating result mimetype ...");

  let mimetype = get_mimetype_for_file(&finished_file)
      .map_err(|err| ProcessSingleJobError::from_io_error(err))?
      .map(|mime| mime.to_string())
      .ok_or(ProcessSingleJobError::Other(anyhow!("Mimetype could not be determined")))?;

  info!("Calculating sha256...");

  let file_checksum = sha256_hash_file(&finished_file)
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
      })?;

  // ==================== UPLOAD AUDIO TO BUCKET ==================== //

  job_progress_reporter.log_status("uploading result")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let result_bucket_location = MediaFileBucketPath::generate_new(
    Some(BUCKET_FILE_PREFIX),
    Some(BUCKET_FILE_EXTENSION));

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  info!("Audio destination bucket path: {:?}", &result_bucket_object_pathbuf);

  info!("Uploading media ...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf,
    &finished_file,
    &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;


  let thumbnail_task_result = ThumbnailTaskBuilder::new_for_source_mimetype(ThumbnailTaskInputMimeType::MP4)
      .with_bucket(&*args.job_dependencies.buckets.public_bucket_client.bucket_name())
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
  // ==================== DELETE TEMP FILES ==================== //

  safe_delete_temp_file(&output_video_fs_path);
  safe_delete_temp_file(&output_video_fs_path_watermark);
  safe_delete_temp_file(&usable_image_path);

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_temp_directory(&work_temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving SadTalker result (media_files table record) ...");

  let (media_file_token, id) = insert_media_file_from_face_animation(InsertArgs {
    pool: &args.job_dependencies.db.mysql_pool,
    job: &job,
    maybe_mime_type: Some(&mimetype),
    file_size_bytes,
    sha256_checksum: &file_checksum,
    public_bucket_directory_hash: result_bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: Some(BUCKET_FILE_PREFIX),
    maybe_public_bucket_extension: Some(BUCKET_FILE_EXTENSION),
    is_on_prem: args.job_dependencies.job.info.container.is_on_prem,
    worker_hostname: &args.job_dependencies.job.info.container.hostname,
    worker_cluster: &args.job_dependencies.job.info.container.cluster_name,
  })
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("SadTalker Done.");

  // TODO: Update upstream to be strongly typed
  let maybe_user_token = job.maybe_creator_user_token.as_deref()
      .map(|token| UserToken::new_from_str(token));

  args.job_dependencies.clients.firehose_publisher.lipsync_animation_finished(
    maybe_user_token.as_ref(),
    &job.inference_job_token,
    media_file_token.as_str())
      .await
      .map_err(|e| {
        error!("error publishing event: {:?}", e);
        ProcessSingleJobError::Other(anyhow!("error publishing event"))
      })?;

  job_progress_reporter.log_status("done")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Job {:?} complete success! Downloaded, ran inference, and uploaded. Saved model record: {}, Result Token: {}",
        job.id, id, &media_file_token);

  Ok(JobSuccessResult {
    maybe_result_entity: Some(ResultEntity {
      entity_type: InferenceResultType::MediaFile,
      entity_token: media_file_token.to_string(),
    }),
    inference_duration,
  })
}

fn get_output_file_extension_from_mimetype(mimetype: &str) -> anyhow::Result<&'static str> {
  let ext = match mimetype {
    "image/jpeg" => "jpg",
    "image/gif" => "gif",
    _ => return Err(anyhow!("Mimetype not supported: {}", mimetype)),
  };
  Ok(ext)
}
