use std::fs::File;
use std::io::Read;
use std::path::PathBuf;

use anyhow::anyhow;
use log::{info, warn};
use tempdir::TempDir;

use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use filesys::check_file_exists::check_file_exists;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use jobs_common::redis_job_status_logger::RedisJobStatusLogger;
use mysql_queries::queries::generic_download::job::list_available_generic_download_jobs::AvailableDownloadJob;
use mysql_queries::queries::voice_conversion::models::insert_voice_conversion_model_from_download_job::{insert_voice_conversion_model_from_download_job, InsertVoiceConversionModelArgs};

use crate::job_loop::job_results::JobResults;
use crate::JobState;

/// Returns the token of the entity.
pub async fn process_softvc_model<'a, 'b>(
  job_state: &JobState,
  job: &AvailableDownloadJob,
  temp_dir: &TempDir,
  download_filename: &str,
  redis_logger: &'a mut RedisJobStatusLogger<'b>,
) -> AnyhowResult<JobResults> {

  // ==================== RUN MODEL CHECK ==================== //

  info!("Checking that softvc model is valid...");

  redis_logger.log_status("checking rocket vc model")?; // NB: "rocket vc" is a codename

  let file_path = PathBuf::from(download_filename);

  let output_metadata_fs_path = temp_dir.path().join("metadata.json");

  let model_check_result = job_state.sidecar_configs.softvc_model_check_command.execute(
    &file_path,
    &output_metadata_fs_path,
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

  info!("Uploading SoftVC model to GCS...");

  let private_bucket_hash = sha256_hash_file(&download_filename)?;

  info!("File hash: {}", private_bucket_hash);

  let model_bucket_path = job_state.bucket_path_unifier.softvc_model_path(&private_bucket_hash);

  info!("Destination bucket path: {:?}", &model_bucket_path);

  redis_logger.log_status("uploading rocket vc  model")?; // NB: "rocket vc" is a codename

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

  info!("Saving Soft VC record...");

  let (_id, model_token) = insert_voice_conversion_model_from_download_job(InsertVoiceConversionModelArgs {
    model_type: VoiceConversionModelType::SoftVc,
    maybe_new_weights_token: None,
    title: &job.title,
    original_download_url: &job.download_url,
    original_filename: &download_filename,
    file_size_bytes: file_metadata.file_size_bytes,
    creator_user_token: &job.creator_user_token,
    creator_ip_address: &job.creator_ip_address,
    creator_set_visibility: Visibility::Public, // TODO: All models default to public at start
    has_index_file: false,
    private_bucket_hash: &private_bucket_hash,
    private_bucket_object_name: &model_bucket_path,
    mysql_pool: &job_state.mysql_pool,
  }).await?;

  job_state.badge_granter.maybe_grant_softvc_vocoder_model_uploads_badge(&job.creator_user_token)
      .await
      .map_err(|e| {
        warn!("error maybe awarding badge: {:?}", e);
        anyhow!("error maybe awarding badge")
      })?;

  Ok(JobResults {
    entity_token: Some(model_token.to_string()),
    // NB(1): "rocket_vc" is codename for softvc
    entity_type: Some("rocket_vc".to_string()), // NB(2): This may be different from `GenericDownloadType` in the future!
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
