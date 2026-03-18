use std::fs::read_to_string;
use std::time::Instant;

use anyhow::anyhow;
use log::{error, info, warn};

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::f5_tts::f5_tts_inference_command::InferenceArgs;
use crate::job::job_types::f5_tts::tts_inference::check_and_validate_job::check_and_validate_job;
use crate::job::job_types::vc::media_for_inference::MediaForInference;
use crate::state::job_dependencies::JobDependencies;
use crate::util::common_commands::ffmpeg::ffmpeg_audio_truncate_args::FfmpegAudioTruncateArgs;
use crate::util::downloaders::maybe_download_file_from_bucket::{maybe_download_file_from_bucket, MaybeDownloadArgs};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use filesys::check_file_exists::check_file_exists;
use filesys::file_exists::file_exists;
use filesys::file_size::file_size;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use media::decode_basic_audio_info::decode_basic_audio_file_info;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_f5_tts::{insert_media_file_from_f5_tts, InsertF5TTSMediaFileArgs};
use mysql_queries::queries::media_files::get::get_media_file_for_inference::get_media_file_for_inference;
use mysql_queries::queries::media_uploads::get_media_upload_for_inference::get_media_upload_for_inference;
use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::media_uploads::MediaUploadToken;

const BUCKET_FILE_PREFIX: &str = "fakeyou_";
const BUCKET_FILE_EXTENSION: &str = ".wav";
const MIME_TYPE: &str = "audio/wav";

pub async fn process_single_f5_tts_inference_job(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob
) -> Result<JobSuccessResult, ProcessSingleJobError> {

  let mut job_progress_reporter = job_dependencies
    .clients
    .job_progress_reporter
    .new_generic_inference(job.inference_job_token.as_str())
    .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  let f5_tts_deps = job_dependencies
    .job
    .job_specific_dependencies
    .maybe_f5_tts_dependencies
    .as_ref()
    .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("Missing F5-TTS dependencies".to_string())))?;

  let job_args = check_and_validate_job(job)?;

  let work_temp_dir = format!("temp_f5_tts_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = job_dependencies
    .fs
    .scoped_temp_dir_creator_for_work
    .new_tempdir(&work_temp_dir)
    .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let output_dir = work_temp_dir.path().join("output");
  let output_file_path = output_dir.join("out.wav");

  if !output_dir.exists() {
    std::fs::create_dir_all(&output_dir)
      .map_err(|err| ProcessSingleJobError::IoError(err))?;
  }

  if output_file_path.exists() {
    std::fs::remove_file(&output_file_path)
      .map_err(|err| ProcessSingleJobError::IoError(err))?;
  }

  let input_text = job_args.input_text;
  let media_token = job.maybe_input_source_token
    .as_deref()
    .ok_or_else(|| ProcessSingleJobError::Other(anyhow!(
        "no associated media token for vc job: {:?}", job.inference_job_token)))?;

  let token_type = job.maybe_input_source_token_type
    .ok_or_else(|| ProcessSingleJobError::Other(anyhow!(
        "no associated media token type for vc job: {:?}", job.inference_job_token)))?;

  let inference_media = match token_type {
    InferenceInputSourceTokenType::MediaFile => {
      // media_files case
      let media_file_token = MediaFileToken::new_from_str(media_token);
      let maybe_media_file = get_media_file_for_inference(&media_file_token, &job_dependencies.db.mysql_pool).await;

      let media_file = match maybe_media_file {
        Ok(Some(media_file)) => media_file,
        Ok(None) => {
          error!("no media file record found for token: {:?}", media_token);
          return Err(ProcessSingleJobError::Other(
            anyhow!("no media file record found for token: {:?}", media_token)));
        }
        Err(err) => {
          error!("error fetching media file record from db: {:?}", err);
          return Err(ProcessSingleJobError::Other(err));
        }
      };

      MediaForInference::MediaFile(media_file)
    }
    InferenceInputSourceTokenType::MediaUpload => {
      // media_uploads case
      let media_upload_token = MediaUploadToken::new_from_str(media_token);
      let maybe_media_upload_result =
        get_media_upload_for_inference(&media_upload_token, &job_dependencies.db.mysql_pool).await;

      let media_upload = match maybe_media_upload_result {
        Ok(Some(media_upload)) => media_upload,
        Ok(None) => {
          error!("no media upload record found for token: {:?}", media_token);
          return Err(ProcessSingleJobError::Other(
            anyhow!("no media upload record found for token: {:?}", media_token)));
        }
        Err(err) => {
          error!("error fetching media upload record from db: {:?}", err);
          return Err(ProcessSingleJobError::Other(err));
        }
      };

      MediaForInference::LegacyMediaUpload(media_upload)
    }
  };


  let stderr_output_file = work_temp_dir.path().join("stderr.txt");
  let stdout_output_file = work_temp_dir.path().join("stdout.txt");
  let text_input_fs_path = work_temp_dir.path().join("inference_input.txt");

  std::fs::write(&text_input_fs_path, &input_text)
    .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let original_media_upload_fs_path = {
    let original_media_upload_fs_path = work_temp_dir.path().join("original.bin");

    let bucket_object_path = inference_media.get_bucket_path();

    info!("Downloading media from bucket path: {:?}", &bucket_object_path);

    maybe_download_file_from_bucket(MaybeDownloadArgs {
      name_or_description_of_file:  "media (original file)",
      final_filesystem_file_path: &original_media_upload_fs_path,
      bucket_object_path: &bucket_object_path,
      bucket_client: &job_dependencies.buckets.public_bucket_client,
      job_progress_reporter: &mut job_progress_reporter,
      job_progress_update_description: "downloading",
      job_id: job.id.0,
      scoped_tempdir_creator: &job_dependencies.fs.scoped_temp_dir_creator_for_work,
      maybe_existing_file_minimum_size_required: None,
    }).await?;

    original_media_upload_fs_path
  };


  let inference_start_time = Instant::now();

  let command_exit_status = f5_tts_deps
    .inference_command
    .execute_inference(InferenceArgs{
      stderr_output_file: &stderr_output_file,
      stdout_output_file: &stdout_output_file,
      reference_audio_path: &original_media_upload_fs_path,
      input_text_file: &text_input_fs_path,
      reference_transcript_path: None,
      output_audio_directory: &output_dir,
    });

  let inference_duration = Instant::now().duration_since(inference_start_time);

  info!("Inference command exited with status: {:?}", command_exit_status);
  info!("Inference took duration to complete: {:?}", &inference_duration);

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that inference output files exist...");

  if let Err(err) = check_file_exists(&output_file_path) {
    if let Ok(contents) = read_to_string(&stdout_output_file) {
      error!("Captured stdout output: {}", contents);
    }
    if let Ok(contents) = read_to_string(&stderr_output_file) {
      error!("Captured stderr output: {}", contents);
    }
    return Err(ProcessSingleJobError::Other(err));
  }

  info!("Inference was successful.");

  // ==================== MAYBE TRUNCATE FILE ==================== //

  // NB: This will be the final audio file we upload to the bucket
  let mut audio_for_upload_path = output_file_path.clone();

  if let Some(truncate_seconds) = job_args.maybe_truncate_seconds {
    if truncate_seconds > 0 {
      let truncated_audio_output_path = output_dir.join("truncated.wav");

      let command_exit_status = f5_tts_deps
          .ffmpeg_command_runner
          .run_with_subprocess(RunAsSubprocessArgs {
            args: Box::new(&FfmpegAudioTruncateArgs {
              input_audio_file: &output_file_path,
              output_audio_file: &truncated_audio_output_path,
              truncate_seconds: truncate_seconds as usize,
            }),
            stderr: StreamRedirection::Pipe,
            stdout: StreamRedirection::Pipe,
          });

      if !command_exit_status.is_success() {
        warn!("Error truncating audio file. Exit status: {:?}", command_exit_status);
      }

      if file_exists(&truncated_audio_output_path) {
        info!("Truncated audio file created successfully.");
        audio_for_upload_path = truncated_audio_output_path;
      } else {
        warn!("Truncated audio file does not exist: {:?}", &truncated_audio_output_path);
      }
    }
  }

  // ==================== DECODE AUDIO FILE ==================== //

  let maybe_audio_info = decode_basic_audio_file_info(
    &audio_for_upload_path, Some(MIME_TYPE), Some("wav"))
      .map_err(|err| {
        warn!("Error decoding audio info: {:?}", err);
        err
      })
      .ok(); // Fail open

  let mut maybe_duration_millis = None;
  let mut maybe_audio_codec_name = None;

  if let Some(audio_info) = maybe_audio_info {
    if audio_info.required_full_decode {
      warn!("Required a full decode of the output data to get duration! That's inefficient! Fix this code.");
    }
    maybe_duration_millis = audio_info.duration_millis;
    maybe_audio_codec_name = audio_info.codec_name
  }

  // ==================== UPLOAD TO BUCKET ==================== //

  info!("Uploading media ...");

  let result_bucket_location = MediaFileBucketPath::generate_new(
    Some(BUCKET_FILE_PREFIX),
    Some(BUCKET_FILE_EXTENSION)
  );

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  // Finished file path
  info!("Upload File Path: {:?}", &audio_for_upload_path);
  info!("Upload Bucket Path: {:?}", result_bucket_object_pathbuf);

  job_dependencies.buckets.public_bucket_client
    .upload_filename_with_content_type(
      &result_bucket_object_pathbuf,
      &audio_for_upload_path,
      &MIME_TYPE
    )
    .await
    .map_err(|e| ProcessSingleJobError::Other(e))?;
  
  // ==================== UPLOAD AUDIO TO BUCKET ====================

  info!("Calculating sha256...");

  let file_checksum = sha256_hash_file(&audio_for_upload_path).map_err(|err| {
    ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
  })?;

  let file_size_bytes = file_size(&audio_for_upload_path).map_err(|err|
    ProcessSingleJobError::Other(err)
  )?;

  job_progress_reporter.log_status("done").map_err(|e| ProcessSingleJobError::Other(e))?;

  let (media_file_token, id) = insert_media_file_from_f5_tts(InsertF5TTSMediaFileArgs {
    pool: &job_dependencies.db.mysql_pool,
    job: &job,
    // text_transcript: &input_text,
    // media_type: MediaFileType::Wav,
    maybe_mime_type: Some(&MIME_TYPE),
    maybe_audio_codec_name: maybe_audio_codec_name.as_deref(),
    maybe_duration_millis,
    file_size_bytes,
    sha256_checksum: &file_checksum,
    public_bucket_directory_hash: result_bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: result_bucket_location.get_optional_prefix(),
    maybe_public_bucket_extension: result_bucket_location.get_optional_extension(),
    is_on_prem: job_dependencies.job.info.container.is_on_prem,
    worker_hostname: &job_dependencies.job.info.container.hostname,
    worker_cluster: &job_dependencies.job.info.container.cluster_name,
  }).await.map_err(|e| ProcessSingleJobError::Other(e))?;

  info!(
    "Job {:?} complete success! Downloaded, ran inference, and uploaded. Saved model token: {}",
    job.id,
    &media_file_token);

  Ok(JobSuccessResult {
    maybe_result_entity: Some(ResultEntity {
      entity_type: InferenceResultType::MediaFile,
      entity_token: media_file_token.to_string(),
    }),
    inference_duration,
  })
}