use std::path::PathBuf;

use anyhow::anyhow;
use log::{error, info, warn};
use tempdir::TempDir;
use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;

use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use filesys::check_file_exists::check_file_exists;
use filesys::file_size::file_size;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use jobs_common::redis_job_status_logger::RedisJobStatusLogger;
use mysql_queries::queries::generic_download::job::list_available_generic_download_jobs::AvailableDownloadJob;
use mysql_queries::queries::model_weights::create::create_model_weight_from_voice_conversion_download_job::{create_model_weight_from_voice_conversion_download_job, CreateModelWeightArgs};
use mysql_queries::queries::voice_conversion::models::insert_voice_conversion_model_from_download_job::{insert_voice_conversion_model_from_download_job, InsertVoiceConversionModelArgs};
use tokens::tokens::model_weights::ModelWeightToken;

use crate::job_loop::job_results::JobResults;
use crate::job_types::voice_conversion::so_vits_svc::so_vits_svc_model_check_command::{CheckArgs, Device};
use crate::JobState;

/// Returns the token of the entity.
pub async fn process_so_vits_svc_model<'a, 'b>(
  job_state: &JobState,
  job: &AvailableDownloadJob,
  temp_dir: &TempDir,
  download_filename: &str,
  redis_logger: &'a mut RedisJobStatusLogger<'b>,
) -> AnyhowResult<JobResults> {

  // ==================== RUN MODEL CHECK ==================== //

  info!("Checking that model is valid...");

  redis_logger.log_status("checking so-vits-svc model")?;

  let original_model_file_path = PathBuf::from(download_filename);

  //let config_path = PathBuf::from("/models/voice_conversion/so-vits-svc/example_config.json"); // TODO: This could be variable.
  //let input_wav_path = PathBuf::from("/models/voice_conversion/so-vits-svc/example.wav"); // TODO: This could be variable.
  let output_wav_path = temp_dir.path().join("output.wav");

  let model_check_result = job_state.sidecar_configs.so_vits_svc_model_check_command.execute_check(CheckArgs {
    model_path: &original_model_file_path,
    maybe_input_path: None,
    output_path: &output_wav_path,
    maybe_config_path: None,
    device: Device::Cuda,
  });

  if let Err(e) = model_check_result {
    safe_delete_file(&original_model_file_path);
    safe_delete_file(&output_wav_path);
    safe_delete_directory(&temp_dir);
    return Err(anyhow!("model check error: {:?}", e));
  }

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output wav file exists...");

  check_file_exists(&output_wav_path)?;

  let file_size_bytes = file_size(&original_model_file_path)?;
  let file_checksum = sha256_hash_file(&original_model_file_path)?;

  // ==================== UPLOAD ORIGINAL MODEL FILE ==================== //

  info!("Uploading so-vits-svc voice conversion model to GCS...");

  let private_bucket_hash = sha256_hash_file(&download_filename)?;

  info!("File hash: {}", private_bucket_hash);

  let model_bucket_path = job_state.bucket_path_unifier.so_vits_svc_model_path(&private_bucket_hash);

  info!("Destination bucket path: {:?}", &model_bucket_path);

  redis_logger.log_status("uploading so-vits-svc TTS model")?;

  if let Err(err) = job_state.private_bucket_client.upload_filename(&model_bucket_path, &original_model_file_path).await {
    error!("Problem uploading original model: {:?}", err);
    safe_delete_file(&original_model_file_path);
    safe_delete_file(&output_wav_path);
    safe_delete_directory(&temp_dir);
    return Err(err);
  }

  info!("Uploading to NEW model weights bucket...");

  let new_model_bucket_path = WeightFileBucketPath::generate_for_svc_model();

  if let Err(err) = job_state.public_bucket_client.upload_filename(new_model_bucket_path.get_full_object_path_str(), &original_model_file_path).await {
    error!("Problem uploading original model to NEW bucket: {:?}", err);
    safe_delete_file(&original_model_file_path);
    safe_delete_file(&output_wav_path);
    safe_delete_directory(&temp_dir);
    return Err(err);
  }

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  info!("Done uploading; deleting temporary files and paths...");
  safe_delete_file(&original_model_file_path);
  safe_delete_file(&output_wav_path);
  safe_delete_directory(&temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving Voice Conversion model record...");

  // TODO(bt,2023-12-18): Once migration is done, move this back into the query code.
  let model_weights_token = ModelWeightToken::generate();

  let (_id, voice_conversion_model_token) = insert_voice_conversion_model_from_download_job(InsertVoiceConversionModelArgs {
    model_type: VoiceConversionModelType::SoVitsSvc,
    maybe_new_weights_token: Some(&model_weights_token),
    title: &job.title,
    original_download_url: &job.download_url,
    original_filename: &download_filename,
    file_size_bytes,
    creator_user_token: &job.creator_user_token,
    creator_ip_address: &job.creator_ip_address,
    creator_set_visibility: Visibility::Public, // TODO: All models default to public at start
    has_index_file: false,
    private_bucket_hash: &private_bucket_hash,
    private_bucket_object_name: "", // TODO: This should go away.
    mysql_pool: &job_state.mysql_pool,
  }).await?;

  info!("Saving model weights record...");

  let (_id, _model_weights_token) = create_model_weight_from_voice_conversion_download_job(CreateModelWeightArgs {
    maybe_use_model_weights_token: Some(model_weights_token.clone()),
    maybe_old_voice_conversion_model_token: Some(voice_conversion_model_token.clone()),
    weights_type: WeightsType::SoVitsSvc,
    weights_category: WeightsCategory::VoiceConversion,
    title: &job.title,
    original_download_url: &job.download_url,
    original_filename: &download_filename,
    file_size_bytes,
    file_checksum_sha2: &file_checksum,
    creator_user_token: &job.creator_user_token,
    creator_ip_address: &job.creator_ip_address,
    creator_set_visibility: Visibility::Public, // TODO: All models default to public at start
    has_index_file: false, // SVC do not have index files.
    public_bucket_hash: new_model_bucket_path.get_object_hash().to_string(),
    maybe_public_bucket_prefix: new_model_bucket_path.get_optional_prefix().map(|p| p.to_string()),
    maybe_public_bucket_extension: new_model_bucket_path.get_optional_extension().map(|p| p.to_string()),
    mysql_pool: &job_state.mysql_pool,
  }).await?;

  job_state.badge_granter.maybe_grant_voice_conversion_model_uploads_badge(&job.creator_user_token)
      .await
      .map_err(|e| {
        warn!("error maybe awarding badge: {:?}", e);
        anyhow!("error maybe awarding badge")
      })?;

  Ok(JobResults {
    entity_token: Some(voice_conversion_model_token.to_string()), // TODO: Swap model token.
    entity_type: Some(VoiceConversionModelType::SoVitsSvc.to_string()), // NB: This may be different from `GenericDownloadType` in the future!
  })
}
