use std::path::PathBuf;

use anyhow::anyhow;
use log::{error, info, warn};
use tempdir::TempDir;

use enums::by_table::tts_models::tts_model_type::TtsModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use filesys::check_file_exists::check_file_exists;
use filesys::file_size::file_size;
use filesys::filename_concat::filename_concat;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use jobs_common::redis_job_status_logger::RedisJobStatusLogger;
use mysql_queries::queries::generic_download::job::list_available_generic_download_jobs::AvailableDownloadJob;
use mysql_queries::queries::tts::tts_models::insert_tts_model_from_download_job;
use mysql_queries::queries::tts::tts_models::insert_tts_model_from_download_job::insert_tts_model_from_download_job;

use crate::job_loop::job_results::JobResults;
use crate::job_types::tts::vits::vits_model_check_command::{CheckArgs, Device};
use crate::JobState;

/// Returns the token of the entity.
pub async fn process_vits_model<'a, 'b>(
  job_state: &JobState,
  job: &AvailableDownloadJob,
  temp_dir: &TempDir,
  download_filename: &str,
  redis_logger: &'a mut RedisJobStatusLogger<'b>,
) -> AnyhowResult<JobResults> {

  // ==================== RUN MODEL CHECK ==================== //

  info!("Checking that model is valid...");

  redis_logger.log_status("checking VITS model")?;

  let original_model_file_path = PathBuf::from(download_filename);

  // NB: We'll be creating the traced model in the "check" step and uploading it to GDrive along with the original.
  let traced_model_file_path = PathBuf::from(filename_concat(&original_model_file_path, "_traced"));

  let config_path = PathBuf::from("configs/ljs_li44_tmbert_nmp_s1_arpa.json"); // TODO: This could be variable.

  let model_check_result = job_state.sidecar_configs.vits_model_check_command.execute_check(CheckArgs {
    traced_model_output_path: &traced_model_file_path,
    model_checkpoint_path: &original_model_file_path,
    config_path: &config_path,
    device: Device::Cuda,
    test_string: "this is a test of model inference",
  });

  if let Err(e) = model_check_result {
    safe_delete_file(&original_model_file_path);
    safe_delete_file(&traced_model_file_path);
    safe_delete_directory(&temp_dir);
    return Err(anyhow!("model check error: {:?}", e));
  }

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output traced model file exists...");

  check_file_exists(&traced_model_file_path)?;

  let file_size_bytes = file_size(&original_model_file_path)?;

  // let file_metadata = match read_metadata_file(&output_metadata_fs_path) {
  //   Ok(metadata) => metadata,
  //   Err(e) => {
  //     safe_delete_file(&file_path);
  //     safe_delete_file(&output_metadata_fs_path);
  //     safe_delete_directory(&temp_dir);
  //     return Err(e);
  //   }
  // };

  // ==================== UPLOAD ORIGINAL MODEL FILE ==================== //

  info!("Uploading VITS TTS model to GCS...");

  let private_bucket_hash = sha256_hash_file(&download_filename)?;

  info!("File hash: {}", private_bucket_hash);

  let model_bucket_path = job_state.bucket_path_unifier.tts_synthesizer_path(&private_bucket_hash);

  info!("Destination bucket path: {:?}", &model_bucket_path);

  redis_logger.log_status("uploading VITS TTS model")?;

  if let Err(err) = job_state.private_bucket_client.upload_filename(&model_bucket_path, &original_model_file_path).await {
    error!("Problem uploading original model: {:?}", err);
    error!(" - Model file: {:?}", &original_model_file_path);
    error!(" - Traced model file: {:?}", &traced_model_file_path);
    safe_delete_file(&original_model_file_path);
    safe_delete_file(&traced_model_file_path);
    safe_delete_directory(&temp_dir);
    return Err(err);
  }

  // ==================== UPLOAD TRACED MODEL FILE ==================== //

  info!("Uploading VITS TTS (traced) model to GCS...");

  let traced_model_bucket_path = job_state.bucket_path_unifier.tts_traced_synthesizer_path(&private_bucket_hash);

  info!("Destination bucket path: {:?}", &traced_model_bucket_path);

  redis_logger.log_status("uploading VITS TTS (traced) model")?;

  if let Err(err) = job_state.private_bucket_client.upload_filename(&traced_model_bucket_path, &traced_model_file_path).await {
    error!("Problem uploading traced model: {:?}", err);
    error!(" - Model file: {:?}", &original_model_file_path);
    error!(" - Traced model file: {:?}", &traced_model_file_path);
    safe_delete_file(&original_model_file_path);
    safe_delete_file(&traced_model_file_path);
    safe_delete_directory(&temp_dir);
    return Err(err);
  }

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  info!("Done uploading; deleting temporary files and paths...");
  safe_delete_file(&original_model_file_path);
  safe_delete_file(&traced_model_file_path);
  safe_delete_directory(&temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving TTS model record...");

  let (_id, model_token) = insert_tts_model_from_download_job(insert_tts_model_from_download_job::InsertTtsModelFromDownloadJobArgs {
    tts_model_type: TtsModelType::Vits,
    title: &job.title,
    original_download_url: &job.download_url,
    original_filename: &download_filename,
    file_size_bytes,
    creator_user_token: &job.creator_user_token,
    creator_ip_address: &job.creator_ip_address,
    creator_set_visibility: Visibility::Public, // TODO: All models default to public at start
    private_bucket_hash: &private_bucket_hash,
    private_bucket_object_name: "", // TODO: This should go away.
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
    entity_type: Some(TtsModelType::Vits.to_string()), // NB: This may be different from `GenericDownloadType` in the future!
  })
}
