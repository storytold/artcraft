use std::path::PathBuf;

use anyhow::anyhow;
use log::{error, info, warn};
use tempdir::TempDir;
use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;

use crockford::crockford_entropy_lower;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use filesys::check_file_exists::check_file_exists;
use filesys::file_deletion::safe_delete_possible_file::safe_delete_possible_file;
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
use crate::job_types::voice_conversion::rvc_v2::extract_rvc_files::{DownloadedRvcFile, extract_rvc_files};
use crate::job_types::voice_conversion::rvc_v2::rvc_v2_model_check_command::CheckArgs;
use crate::JobState;

/// Returns the token of the entity.
pub async fn process_rvc_v2_model<'a, 'b>(
  job_state: &JobState,
  job: &AvailableDownloadJob,
  temp_dir: &TempDir,
  download_filename: &str,
  redis_logger: &'a mut RedisJobStatusLogger<'b>,
) -> AnyhowResult<JobResults> {

  info!("Processing model file...");
  redis_logger.log_status("checking rvc (v2) model")?;

  // ==================== DOWNLOAD HUBERT ==================== //

  job_state.pretrained_models.rvc_v2_hubert.download_if_not_on_filesystem(
    &job_state.private_bucket_client,
    temp_dir,
  ).await?;

  // ==================== DETERMINE FILE CONTENTS ==================== //

  info!("Determining download file contents: {:?}", &download_filename);

  let original_download_file_path = PathBuf::from(download_filename);

  let download_contents = extract_rvc_files(&original_download_file_path, temp_dir)?;

  info!("Contents of downloaded RVC model: {:?}", &download_contents);

  let original_model_file_path;
  let maybe_original_model_index_file_path: Option<PathBuf>; // TODO RENAME MAYBE

  match download_contents {
    DownloadedRvcFile::InvalidModel => {
      return Err(anyhow!("download did not contain a valid model payload"));
    }
    DownloadedRvcFile::ModelFileOnly { model_file } => {
      info!("RVC download only contains a model (no index file).");
      original_model_file_path = model_file;
      maybe_original_model_index_file_path = None;
    }
    DownloadedRvcFile::ModelAndIndexFile { model_file, index_file } => {
      info!("RVC download contains both a model and an index file.");
      original_model_file_path = model_file;
      maybe_original_model_index_file_path = Some(index_file);
    }
  }

  // ==================== RUN MODEL CHECK ==================== //

  info!("Checking that model is valid...");

  let output_wav_path = temp_dir.path().join("output.wav");

  let model_check_result = job_state.sidecar_configs.rvc_v2_model_check_command.execute_check(CheckArgs {
    model_path: &original_model_file_path,
    maybe_model_index_path: maybe_original_model_index_file_path.as_deref(),
    hubert_path: &job_state.pretrained_models.rvc_v2_hubert.filesystem_path,
    maybe_input_path: None,
    output_path: &output_wav_path,
  });

  if let Err(e) = model_check_result {
    safe_delete_file(&original_model_file_path);
    safe_delete_possible_file(maybe_original_model_index_file_path.as_deref());
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

  info!("Uploading rvc (v2) voice conversion model to GCS...");

  let private_bucket_hash = crockford_entropy_lower(64);

  info!("Entropic bucket hash: {}", private_bucket_hash);

  let model_bucket_path = job_state.bucket_path_unifier.rvc_v2_model_path(&private_bucket_hash);

  info!("Destination bucket path (model): {:?}", &model_bucket_path);

  redis_logger.log_status("uploading rvc (v2) TTS model")?;

  if let Err(err) = job_state.private_bucket_client.upload_filename(&model_bucket_path, &original_model_file_path).await {
    error!("Problem uploading model file: {:?}", err);
    safe_delete_file(&original_model_file_path);
    safe_delete_possible_file(maybe_original_model_index_file_path.as_deref());
    safe_delete_file(&output_wav_path);
    safe_delete_directory(&temp_dir);
    return Err(err);
  }

  info!("Uploading to NEW model weights bucket...");

  let new_model_bucket_path = WeightFileBucketPath::generate_for_rvc_model();

  if let Err(err) = job_state.public_bucket_client.upload_filename(new_model_bucket_path.get_full_object_path_str(), &original_model_file_path).await {
    error!("Problem uploading original model to NEW bucket: {:?}", err);
    safe_delete_file(&original_model_file_path);
    safe_delete_file(&output_wav_path);
    safe_delete_directory(&temp_dir);
    return Err(err);
  }

  // ==================== UPLOAD ORIGINAL MODEL INDEX FILE ==================== //

  if let Some(original_index_file_path) = maybe_original_model_index_file_path.as_deref() {
    let model_index_bucket_path = job_state.bucket_path_unifier.rvc_v2_model_index_path(&private_bucket_hash);

    info!("Destination bucket path (index): {:?}", &model_index_bucket_path);

    if let Err(err) = job_state.private_bucket_client.upload_filename(&model_index_bucket_path, &original_index_file_path).await {
      error!("Problem uploading index file: {:?}", err);
      safe_delete_file(&original_model_file_path);
      safe_delete_file(&original_index_file_path);
      safe_delete_file(&output_wav_path);
      safe_delete_directory(&temp_dir);
      return Err(err);
    }

    info!("Uploading to NEW model weights (index) bucket...");

    let new_index_bucket_path
        = WeightFileBucketPath::rvc_index_file_from_object_hash(new_model_bucket_path.get_object_hash());

    if let Err(err) = job_state.public_bucket_client.upload_filename(new_index_bucket_path.get_full_object_path_str(), &original_index_file_path).await {
      error!("Problem uploading original model to NEW bucket: {:?}", err);
      safe_delete_file(&original_model_file_path);
      safe_delete_file(&original_index_file_path);
      safe_delete_file(&output_wav_path);
      safe_delete_directory(&temp_dir);
      return Err(err);
    }
  }

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  info!("Done uploading; deleting temporary files and paths...");
  safe_delete_file(&original_model_file_path);
  safe_delete_possible_file(maybe_original_model_index_file_path.as_deref());
  safe_delete_file(&output_wav_path);
  safe_delete_directory(&temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving Voice Conversion model record...");

  // TODO(bt,2023-12-18): Once migration is done, move this back into the query code.
  let model_weights_token = ModelWeightToken::generate();

  let (_id, voice_conversion_model_token) = insert_voice_conversion_model_from_download_job(InsertVoiceConversionModelArgs {
    model_type: VoiceConversionModelType::RvcV2,
    maybe_new_weights_token: Some(&model_weights_token),
    title: &job.title,
    original_download_url: &job.download_url,
    original_filename: &download_filename,
    file_size_bytes,
    creator_user_token: &job.creator_user_token,
    creator_ip_address: &job.creator_ip_address,
    creator_set_visibility: Visibility::Public, // TODO: All models default to public at start
    has_index_file: maybe_original_model_index_file_path.is_some(),
    private_bucket_hash: &private_bucket_hash,
    private_bucket_object_name: "", // TODO: This should go away.
    mysql_pool: &job_state.mysql_pool,
  }).await?;

  info!("Saving model weights record...");

  let (_id, _model_weights_token) = create_model_weight_from_voice_conversion_download_job(CreateModelWeightArgs {
    maybe_use_model_weights_token: Some(model_weights_token.clone()),
    maybe_old_voice_conversion_model_token: Some(voice_conversion_model_token.clone()),
    weights_type: WeightsType::RvcV2,
    weights_category: WeightsCategory::VoiceConversion,
    title: &job.title,
    original_download_url: &job.download_url,
    original_filename: &download_filename,
    file_size_bytes,
    file_checksum_sha2: &file_checksum,
    creator_user_token: &job.creator_user_token,
    creator_ip_address: &job.creator_ip_address,
    creator_set_visibility: Visibility::Public, // TODO: All models default to public at start
    has_index_file: maybe_original_model_index_file_path.is_some(),
    public_bucket_hash: new_model_bucket_path.get_object_hash().to_string(),
    maybe_public_bucket_prefix: new_model_bucket_path.get_optional_prefix().map(|s| s.to_string()),
    maybe_public_bucket_extension: new_model_bucket_path.get_optional_extension().map(|s| s.to_string()),
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
    entity_type: Some(VoiceConversionModelType::RvcV2.to_string()), // NB: This may be different from `GenericDownloadType` in the future!
  })
}
