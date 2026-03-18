use std::path::PathBuf;

use anyhow::anyhow;
use log::{error, warn};
use sqlx::MySqlPool;
use tempdir::TempDir;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use bucket_paths::legacy::typified_paths::public::media_uploads::bucket_file_path::MediaUploadOriginalFilePath;
use bucket_paths::legacy::typified_paths::public::voice_conversion_results::bucket_file_path::VoiceConversionResultOriginalFilePath;
use cloud_storage::bucket_client::BucketClient;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporter;
use mysql_queries::payloads::generic_inference_args::inner_payloads::lipsync_payload::LipsyncAnimationAudioSource;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::media_uploads::get_media_upload_for_inference::get_media_upload_for_inference;
use mysql_queries::queries::voice_conversion::results::get_voice_conversion_result_for_inference::get_voice_conversion_result_for_inference;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::media_uploads::MediaUploadToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::downloaders::maybe_download_file_from_bucket::{maybe_download_file_from_bucket, MaybeDownloadArgs};
use crate::util::filesystem::scoped_temp_dir_creator::ScopedTempDirCreator;

pub struct AudioFile {
  pub filesystem_path: PathBuf,
}

pub struct DownloadAudioFileArgs<'a> {
  pub audio_source: &'a LipsyncAnimationAudioSource,
  pub public_bucket_client: &'a BucketClient,
  pub job_progress_reporter: &'a mut Box<dyn JobProgressReporter>,
  pub job: &'a AvailableInferenceJob,
  pub temp_dir_creator: &'a ScopedTempDirCreator,
  pub work_temp_dir: &'a TempDir,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn download_audio_file(args: DownloadAudioFileArgs<'_>) -> Result<AudioFile, ProcessSingleJobError> {

  let bucket_object_path;

  match args.audio_source {
    LipsyncAnimationAudioSource::F(media_file_token) => {
      bucket_object_path = from_media_file(media_file_token, &args).await?;
    }
    LipsyncAnimationAudioSource::U(media_upload_token) => {
      bucket_object_path = from_media_upload(media_upload_token, &args).await?;
    }
    LipsyncAnimationAudioSource::T(_tts_result_token) => {
      // NB(bt,2023-12-08): This will likely never be implemented now that TTS is on media files.
      return Err(ProcessSingleJobError::NotYetImplemented)
    }
    LipsyncAnimationAudioSource::V(voice_conversion_result_token) => {
      bucket_object_path = from_voice_conversion_result(voice_conversion_result_token, &args).await?;
    }
  }

  let downloaded_filesystem_path = args.work_temp_dir.path().join("audio.bin");

  maybe_download_file_from_bucket(MaybeDownloadArgs {
    name_or_description_of_file: "audio file",
    final_filesystem_file_path: &downloaded_filesystem_path,
    bucket_object_path: &bucket_object_path,
    bucket_client: args.public_bucket_client,
    job_progress_reporter: args.job_progress_reporter,
    job_progress_update_description: "downloading",
    job_id: args.job.id.0,
    scoped_tempdir_creator: &args.temp_dir_creator,
    maybe_existing_file_minimum_size_required: None,
  }).await?;

  Ok(AudioFile {
    filesystem_path: downloaded_filesystem_path,
  })
}

async fn from_media_file(media_file_token: &str, args: &DownloadAudioFileArgs<'_>) -> Result<PathBuf, ProcessSingleJobError> {
  let media_file_token = MediaFileToken::new_from_str(media_file_token);
  let media_file_result = get_media_file(
    &media_file_token,
    true,
    args.mysql_pool
  ).await;

  let media_file_result = match media_file_result {
    Ok(Some(result)) => result,
    Ok(None) => {
      warn!("could not find media file: {:?}", media_file_token);
      return Err(ProcessSingleJobError::from_anyhow_error(
        anyhow!("could not find media file : {:?}", media_file_token)))
    }
    Err(e) => {
      error!("could not query media file: {:?}", e);
      return Err(ProcessSingleJobError::from_anyhow_error(e))
    }
  };

  let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file_result.public_bucket_directory_hash,
    media_file_result.maybe_public_bucket_prefix.as_deref(),
    media_file_result.maybe_public_bucket_extension.as_deref());

  Ok(media_file_bucket_path.to_full_object_pathbuf())
}

async fn from_media_upload(media_upload_token: &str, args: &DownloadAudioFileArgs<'_>) -> Result<PathBuf, ProcessSingleJobError> {
  let media_upload_token = MediaUploadToken::new_from_str(media_upload_token);
  let media_upload_result = get_media_upload_for_inference(
    &media_upload_token,
    args.mysql_pool
  ).await;

  let media_upload_result = match media_upload_result {
    Ok(Some(result)) => result,
    Ok(None) => {
      warn!("could not find media upload: {:?}", media_upload_token);
      return Err(ProcessSingleJobError::from_anyhow_error(
        anyhow!("could not find media upload: {:?}", media_upload_token)))
    }
    Err(e) => {
      error!("could not query media upload: {:?}", e);
      return Err(ProcessSingleJobError::from_anyhow_error(e))
    }
  };

  let media_upload_bucket_path = MediaUploadOriginalFilePath::from_object_hash(&media_upload_result.public_bucket_directory_hash);

  Ok(media_upload_bucket_path.to_full_object_pathbuf())
}

async fn from_voice_conversion_result(voice_conversion_result_token: &str, args: &DownloadAudioFileArgs<'_>) -> Result<PathBuf, ProcessSingleJobError> {
  let voice_conversion_result = get_voice_conversion_result_for_inference(
    voice_conversion_result_token,
    false,
    &args.mysql_pool,
  ).await;

  let voice_conversion_result = match voice_conversion_result {
    Ok(Some(result)) => result,
    Ok(None) => {
      warn!("could not find voice conversion result: {:?}", voice_conversion_result_token);
      return Err(ProcessSingleJobError::from_anyhow_error(
        anyhow!("could not find voice conversion result: {:?}", voice_conversion_result_token)))
    }
    Err(e) => {
      error!("could not query voice conversion result: {:?}", e);
      return Err(ProcessSingleJobError::from_anyhow_error(e))
    }
  };

  let result_bucket_path = VoiceConversionResultOriginalFilePath::from_object_hash(&voice_conversion_result.public_bucket_hash);

  Ok(result_bucket_path.to_full_object_pathbuf())
}
