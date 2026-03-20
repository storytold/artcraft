use anyhow::anyhow;
use sqlx::{MySql, MySqlPool, Transaction};

use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::queries::voice_conversion::migration::list_whole_voice_conversion_models_using_cursor::WholeVoiceConversionModelRecord;

pub struct CopiedFileData {
  pub bucket_path: WeightFileBucketPath,
  pub file_sha_hash: String,
}

/// Migrate `voice_conversion_models` records to `model_weights` + `model_weights_extension_voice_conversion_details` records.
/// This is designed to be idempotent and re-runnable. Any time we re-run the query, we should get the same result.
/// This will enable us to perfect the query and get the write flows online and switched over.
///
pub async fn upsert_model_weight_from_voice_conversion_model(
  record: &WholeVoiceConversionModelRecord,
  mysql_pool: &MySqlPool,
  copied_data: &CopiedFileData,
) -> AnyhowResult<()> {

  let mut transaction = mysql_pool.begin().await?;

  let model_weight_token = create_or_generate_token(record);

  upsert_model_weights_record(record, &model_weight_token, copied_data, &mut transaction).await?;
  upsert_model_weights_extension_record(record, &model_weight_token, &mut transaction).await?;

  update_original_record(record, &model_weight_token, &mut transaction).await?;

  transaction.commit().await?;

  Ok(())
}

pub fn create_or_generate_token(record: &WholeVoiceConversionModelRecord) -> ModelWeightToken {
  match record.maybe_migration_new_model_weights_token {
    Some(ref token) => token.clone(),
    None => ModelWeightToken::generate(),
  }
}

pub async fn upsert_model_weights_record(
  record: &WholeVoiceConversionModelRecord,
  model_weight_token: &ModelWeightToken,
  copied_data: &CopiedFileData,
  transaction: &mut Transaction<'_, MySql>,
) -> AnyhowResult<()> {

  let weights_type = match record.model_type {
    VoiceConversionModelType::SoftVc => return Err(anyhow!("we never built softvc models")),
    VoiceConversionModelType::RvcV2 => WeightsType::RvcV2,
    VoiceConversionModelType::SoVitsSvc => WeightsType::SoVitsSvc,
  };

  const WEIGHTS_CATEGORY : WeightsCategory = WeightsCategory::VoiceConversion;

  // NB: Not setting a few fields (for now)
  // maybe_last_update_user_token - seems like bad design
  // TODO(bt): file checksum
  // TODO(bt): rename maybe_public_bucket_extension to maybe_public_bucket_suffix (!!!)
  // TODO(bt): do we need model_weights.ip_address_last_update without audit logs?
  // TODO(bt): rename creator_ip_address to ip_address_creation (and add ip_address_last_update)
  // TODO(bt): Check model_weights column integer types - signed vs unsigned
  let query = sqlx::query!(
        r#"
INSERT INTO model_weights
SET
  token = ?,
  weights_type = ?,
  weights_category = ?,
  title = ?,
  maybe_cover_image_media_file_token = NULL,
  maybe_description_markdown = ?,
  maybe_description_rendered_html = ?,
  creator_user_token = ?,
  creator_ip_address = ?,

  creator_set_visibility = ?,
  maybe_last_update_user_token = NULL,
  original_download_url = ?,
  original_filename = ?,
  file_size_bytes = ?,
  file_checksum_sha2 = ?,

  public_bucket_hash = ?,
  maybe_public_bucket_prefix = ?,
  maybe_public_bucket_extension = ?,

  maybe_migration_old_model_token = ?,
  version = ?,
  created_at = ?,
  updated_at = ?,
  user_deleted_at = ?,
  mod_deleted_at = ?

ON DUPLICATE KEY UPDATE
  weights_type = ?,
  weights_category = ?,
  title = ?,
  maybe_cover_image_media_file_token = NULL,
  maybe_description_markdown = ?,
  maybe_description_rendered_html = ?,
  creator_user_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,
  maybe_last_update_user_token = NULL,
  original_download_url = ?,
  original_filename = ?,
  file_size_bytes = ?,
  file_checksum_sha2 = ?,
  public_bucket_hash = ?,
  maybe_public_bucket_prefix = ?,
  maybe_public_bucket_extension = ?,
  maybe_migration_old_model_token = ?,
  version = ?,
  created_at = ?,
  updated_at = ?,
  user_deleted_at = ?,
  mod_deleted_at = ?
        "#,
    // Insert
    model_weight_token,
    weights_type,
    WEIGHTS_CATEGORY,
    record.title,
    record.description_markdown,
    record.description_rendered_html,
    record.creator_user_token,
    record.ip_address_creation,
    record.creator_set_visibility.to_str(),
    record.original_download_url,
    record.original_filename,
    record.file_size_bytes,

    copied_data.file_sha_hash,
    copied_data.bucket_path.get_object_hash(),
    copied_data.bucket_path.get_optional_prefix(),
    copied_data.bucket_path.get_optional_extension(),

    record.token.as_str(),
    record.version,
    record.created_at,
    record.updated_at,
    record.user_deleted_at,
    record.mod_deleted_at,

    // Update
    weights_type,
    WEIGHTS_CATEGORY,
    record.title,
    record.description_markdown,
    record.description_rendered_html,
    record.creator_user_token,
    record.ip_address_creation,
    record.creator_set_visibility.to_str(),
    record.original_download_url,
    record.original_filename,
    record.file_size_bytes,

    copied_data.file_sha_hash,
    copied_data.bucket_path.get_object_hash(),
    copied_data.bucket_path.get_optional_prefix(),
    copied_data.bucket_path.get_optional_extension(),

    record.token.as_str(),
    record.version,
    record.created_at,
    record.updated_at,
    record.user_deleted_at,
    record.mod_deleted_at,
  );

  let _r = query.execute(&mut **transaction).await?;

  Ok(())
}

pub async fn upsert_model_weights_extension_record(
  record: &WholeVoiceConversionModelRecord,
  model_weight_token: &ModelWeightToken,
  transaction: &mut Transaction<'_, MySql>
) -> AnyhowResult<()> {
  let query = sqlx::query!(
        r#"
INSERT INTO model_weights_extension_voice_conversion_details
SET
  model_weights_token = ?,
  has_index_file = ?
ON DUPLICATE KEY UPDATE
  has_index_file = ?
        "#,
      &model_weight_token,
      record.has_index_file,
      record.has_index_file
    );

  let _r = query.execute(&mut **transaction).await?;

  Ok(())
}

pub async fn update_original_record(
  record: &WholeVoiceConversionModelRecord,
  model_weight_token: &ModelWeightToken,
  transaction: &mut Transaction<'_, MySql>
) -> AnyhowResult<()> {
  let query = sqlx::query!(
        r#"
UPDATE voice_conversion_models
SET
  maybe_migration_new_model_weights_token = ?
WHERE token = ?
        "#,
      model_weight_token,
      record.token,
    );

  let _r = query.execute(&mut **transaction).await?;

  Ok(())
}
