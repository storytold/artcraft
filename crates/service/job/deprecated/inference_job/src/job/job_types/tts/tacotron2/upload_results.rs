use std::path::Path;

use anyhow::anyhow;
use log::info;
use tempdir::TempDir;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use hashing::sha256::sha256_hash_string::sha256_hash_string;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporter;
use mysql_queries::column_types::vocoder_type::VocoderType;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_tacotron2::{insert_media_file_from_tacotron2, InsertMediaFileArgs};
use mysql_queries::queries::tts::tts_results::insert_tts_result::insert_tts_result;
use mysql_queries::queries::tts::tts_results::insert_tts_result::JobType;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::tts::tacotron2::process_job::FileMetadata;
use crate::state::job_dependencies::JobDependencies;

const BUCKET_FILE_PREFIX: &str = "fakeyou_";
const BUCKET_FILE_EXTENSION: &str = ".wav";
const MIME_TYPE: &str = "audio/wav";

pub struct UploadResultArgs<'a> {
  // System
  pub job_dependencies: &'a JobDependencies,
  pub job_progress_reporter: &'a mut Box<dyn JobProgressReporter>,

  // Job
  pub job: &'a AvailableInferenceJob,
  pub cleaned_inference_text: &'a str,
  pub work_temp_dir: &'a TempDir,
  pub pretrained_vocoder: VocoderType,

  // Outputs
  pub file_metadata: &'a FileMetadata,
  pub maybe_audio_duration_millis: Option<u64>,
  pub maybe_audio_codec_name: Option<&'a str>,
  pub output_audio_fs_path: &'a Path,
  pub output_spectrogram_fs_path: &'a Path,

  // Flags
  pub upload_as_media_file: bool,
}

pub struct ResultDetails {
  pub entity_type: InferenceResultType,
  pub entity_token: String,
}

pub async fn upload_results(args: UploadResultArgs<'_>) -> Result<ResultDetails, ProcessSingleJobError>{
  if args.upload_as_media_file {
    upload_as_media_file(args).await
  } else {
    upload_as_legacy_tts_result(args).await
  }
}

async fn upload_as_media_file(args: UploadResultArgs<'_>) -> Result<ResultDetails, ProcessSingleJobError>{

  // ==================== UPLOAD AUDIO TO BUCKET ==================== //

  args.job_progress_reporter.log_status("uploading result")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let result_bucket_location = MediaFileBucketPath::generate_new(
    Some(BUCKET_FILE_PREFIX),
    Some(BUCKET_FILE_EXTENSION)
  );

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  info!("Audio destination bucket path: {:?}", &result_bucket_location.to_full_object_pathbuf());

  info!("Uploading audio...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf,
    &args.output_audio_fs_path,
    "audio/wav")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let file_checksum = sha256_hash_file(&args.output_audio_fs_path).map_err(|err| {
    ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
  })?;

  safe_delete_file(&args.output_audio_fs_path);

  // ==================== UPLOAD SPECTROGRAM TO BUCKETS ==================== //

  // (SKIP FOR NOW)

  // ==================== DELETE WORK DIRECTORY ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_directory(&args.work_temp_dir.path());

  // ==================== SAVE RECORDS ==================== //

  info!("Saving tts inference record...");

  let (inference_result_token, _id) = insert_media_file_from_tacotron2(InsertMediaFileArgs {
    pool: &args.job_dependencies.db.mysql_pool,
    job: &args.job,
    maybe_mime_type: Some(&MIME_TYPE),
    file_size_bytes: args.file_metadata.file_size_bytes,
    maybe_duration_millis: args.maybe_audio_duration_millis,
    maybe_audio_codec_name: args.maybe_audio_codec_name,
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

  Ok(ResultDetails {
    entity_type: InferenceResultType::MediaFile,
    entity_token: inference_result_token.to_string(),
  })
}


async fn upload_as_legacy_tts_result(args: UploadResultArgs<'_>) -> Result<ResultDetails, ProcessSingleJobError>{

  // ==================== UPLOAD AUDIO TO BUCKET ==================== //

  args.job_progress_reporter.log_status("uploading result")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let audio_result_object_path = args.job_dependencies.buckets.bucket_path_unifier.tts_inference_wav_audio_output_path(
    &args.job.uuid_idempotency_token); // TODO: Don't use this!

  info!("Audio destination bucket path: {:?}", &audio_result_object_path);

  info!("Uploading audio...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &audio_result_object_path,
    &args.output_audio_fs_path,
    "audio/wav")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  safe_delete_file(&args.output_audio_fs_path);

  // ==================== UPLOAD SPECTROGRAM TO BUCKETS ==================== //

  let spectrogram_result_object_path = args.job_dependencies.buckets.bucket_path_unifier.tts_inference_spectrogram_output_path(
    &args.job.uuid_idempotency_token); // TODO: Don't use this!

  info!("Spectrogram destination bucket path: {:?}", &spectrogram_result_object_path);

  info!("Uploading spectrogram...");

  args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
    &spectrogram_result_object_path,
    &args.output_spectrogram_fs_path,
    "application/json")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  safe_delete_file(&args.output_spectrogram_fs_path);

  // ==================== DELETE WORK DIRECTORY ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_directory(&args.work_temp_dir.path());

  // ==================== SAVE RECORDS ==================== //

  let text_hash = sha256_hash_string(&args.cleaned_inference_text)
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Saving tts inference record...");

  let (_id, inference_result_token) = insert_tts_result(
    &args.job_dependencies.db.mysql_pool,
    JobType::GenericInferenceJob(&args.job),
    &text_hash,
    Some(args.pretrained_vocoder),
    &audio_result_object_path,
    &spectrogram_result_object_path,
    args.file_metadata.file_size_bytes,
    args.file_metadata.duration_millis.unwrap_or(0),
    args.job_dependencies.job.info.container.is_on_prem,
    &args.job_dependencies.job.info.container.hostname,
    args.job_dependencies.job.system.is_debug_worker)
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  Ok(ResultDetails {
    entity_type: InferenceResultType::TextToSpeech,
    entity_token: inference_result_token,
  })
}
