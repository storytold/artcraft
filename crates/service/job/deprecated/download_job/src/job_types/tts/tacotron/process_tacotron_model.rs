use std::fs::File;
use std::io::Read;
use std::path::PathBuf;

use anyhow::anyhow;
use log::{info, warn};
use tempdir::TempDir;

use enums::by_table::tts_models::tts_model_type::TtsModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use filesys::check_file_exists::check_file_exists;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use jobs_common::redis_job_status_logger::RedisJobStatusLogger;
use mysql_queries::queries::generic_download::job::list_available_generic_download_jobs::AvailableDownloadJob;
use mysql_queries::queries::tts::tts_models::insert_tts_model_from_download_job;
use mysql_queries::queries::tts::tts_models::insert_tts_model_from_download_job::insert_tts_model_from_download_job;

use crate::job_loop::job_results::JobResults;
use crate::JobState;

/// Returns the token of the entity.
pub async fn process_tacotron_model<'a, 'b>(
  job_state: &JobState,
  job: &AvailableDownloadJob,
  temp_dir: &TempDir,
  download_filename: &str,
  redis_logger: &'a mut RedisJobStatusLogger<'b>,
) -> AnyhowResult<JobResults> {

  // ==================== RUN MODEL CHECK ==================== //

  info!("Checking that model is valid...");

  redis_logger.log_status("checking tacotron model")?;

  let file_path = PathBuf::from(download_filename);

  let output_metadata_fs_path = temp_dir.path().join("metadata.json");

  let model_check_result = job_state.sidecar_configs.tacotron_model_check_command.execute(
    &file_path,
    &output_metadata_fs_path,
    false
  );

  if let Err(e) = model_check_result {
    safe_delete_file(&file_path);
    safe_delete_directory(&temp_dir);
    return Err(anyhow!("model check error: {:?}", e));
  }

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that metadata output file exists...");

  check_file_exists(&output_metadata_fs_path)?;

  let file_metadata = match read_metadata_file(&output_metadata_fs_path) {
    Ok(metadata) => metadata,
    Err(e) => {
      safe_delete_file(&file_path);
      safe_delete_file(&output_metadata_fs_path);
      safe_delete_directory(&temp_dir);
      return Err(e);
    }
  };

  // ==================== UPLOAD MODEL FILE ==================== //

  info!("Uploading Tacotron TTS model to GCS...");

  let private_bucket_hash = sha256_hash_file(&download_filename)?;

  info!("File hash: {}", private_bucket_hash);

  // FIXME(bt,2023-11-27): 'bucket_path_unifier' is super deprecated. Do not use it anymore or for anything except TT2!
  let model_bucket_path = job_state.bucket_path_unifier.tts_synthesizer_path(&private_bucket_hash);

  info!("Destination bucket path: {:?}", &model_bucket_path);

  redis_logger.log_status("uploading tacotron TTS model")?;

  // TODO(bt,2023-11-27): This method of uploading model files is super deprecated.
  //  Try to standardize on something resembling media_files going forward.
  if let Err(e) = job_state.private_bucket_client.upload_filename(&model_bucket_path, &file_path).await {
    safe_delete_file(&output_metadata_fs_path);
    safe_delete_file(&file_path);
    safe_delete_directory(&temp_dir);
    return Err(e);
  }

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_file(&output_metadata_fs_path);
  safe_delete_file(&file_path);
  safe_delete_directory(&temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving TTS model record...");

  let (_id, model_token) = insert_tts_model_from_download_job(insert_tts_model_from_download_job::InsertTtsModelFromDownloadJobArgs {
    tts_model_type: TtsModelType::Tacotron2,
    title: &job.title,
    original_download_url: &job.download_url,
    original_filename: &download_filename,
    file_size_bytes: file_metadata.file_size_bytes,
    creator_user_token: &job.creator_user_token,
    creator_ip_address: &job.creator_ip_address,
    creator_set_visibility: Visibility::Public, // TODO: All models default to public at start
    private_bucket_hash: &private_bucket_hash,
    private_bucket_object_name: &model_bucket_path,
    maybe_model_token: None, // NB: This parameter is for internal testing only
    mysql_pool: &job_state.mysql_pool,
  }).await?;

  job_state.badge_granter.maybe_grant_tts_model_uploads_badge(&job.creator_user_token)
      .await
      .map_err(|e| {
        warn!("error maybe awarding badge: {:?}", e);
        anyhow!("error maybe awarding badge")
      })?;

  Ok(JobResults {
    entity_token: Some(model_token.to_string()),
    entity_type: Some(TtsModelType::Tacotron2.to_string()), // NB: This may be different from `GenericDownloadType` in the future!
  })
}

#[derive(Deserialize)]
struct FileMetadata {
  pub file_size_bytes: u64,
}

fn read_metadata_file(filename: &PathBuf) -> AnyhowResult<FileMetadata> {
  let mut file = File::open(filename)?;
  let mut buffer = String::new();
  file.read_to_string(&mut buffer)?;
  Ok(serde_json::from_str(&buffer)?)
}

