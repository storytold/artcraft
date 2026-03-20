use sqlx::{MySql, MySqlPool, Transaction};

use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::queries::tts::tts_models::migration::list_whole_tts_models_using_cursor::WholeTtsModelRecord;

pub struct CopiedTtsFileData {
  pub bucket_path: WeightFileBucketPath,
  pub file_sha_hash: String,
}

/// Migrate `tts_models` records to `model_weights` + `model_weights_extension_tts_details` records.
/// This is designed to be idempotent and re-runnable. Any time we re-run the query, we should get the same result.
/// This will enable us to perfect the query and get the write flows online and switched over.
///
pub async fn upsert_model_weight_from_tts_model(
  record: &WholeTtsModelRecord,
  mysql_pool: &MySqlPool,
  copied_data: &CopiedTtsFileData,
) -> AnyhowResult<()> {

  let mut transaction = mysql_pool.begin().await?;

  let model_weight_token = create_or_generate_token(record);

  upsert_model_weights_record(record, &model_weight_token, copied_data, &mut transaction).await?;
  upsert_model_weights_extension_record(record, &model_weight_token, &mut transaction).await?;

  update_original_record(record, &model_weight_token, &mut transaction).await?;

  transaction.commit().await?;

  Ok(())
}

pub fn create_or_generate_token(record: &WholeTtsModelRecord) -> ModelWeightToken {
  match record.maybe_migration_new_model_weights_token {
    Some(ref token) => token.clone(),
    None => ModelWeightToken::generate(),
  }
}

pub async fn upsert_model_weights_record(
  record: &WholeTtsModelRecord,
  model_weight_token: &ModelWeightToken,
  copied_data: &CopiedTtsFileData,
  transaction: &mut Transaction<'_, MySql>,
) -> AnyhowResult<()> {

  // NB: We never supported other TTS models in the tts_models table.
  const WEIGHTS_TYPE : WeightsType = WeightsType::Tacotron2;
  const WEIGHTS_CATEGORY : WeightsCategory = WeightsCategory::TextToSpeech;

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
    WEIGHTS_TYPE,
    WEIGHTS_CATEGORY,
    record.title,
    record.description_markdown,
    record.description_rendered_html,
    record.creator_user_token,
    record.creator_ip_address_creation,
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
    WEIGHTS_TYPE,
    WEIGHTS_CATEGORY,
    record.title,
    record.description_markdown,
    record.description_rendered_html,
    record.creator_user_token,
    record.creator_ip_address_creation,
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
  record: &WholeTtsModelRecord,
  model_weight_token: &ModelWeightToken,
  transaction: &mut Transaction<'_, MySql>
) -> AnyhowResult<()> {
  let query = sqlx::query!(
        r#"
INSERT INTO model_weights_extension_tts_details
SET
  model_weights_token = ?,
  ietf_language_tag = ?,
  ietf_primary_language_subtag = ?,
  text_pipeline_type = ?,
  use_default_mel_multiply_factor = ?,
  maybe_custom_mel_multiply_factor = ?,
  maybe_default_pretrained_vocoder = ?,
  maybe_custom_vocoder_token = ?
ON DUPLICATE KEY UPDATE
  ietf_language_tag = ?,
  ietf_primary_language_subtag = ?,
  text_pipeline_type = ?,
  use_default_mel_multiply_factor = ?,
  maybe_custom_mel_multiply_factor = ?,
  maybe_default_pretrained_vocoder = ?,
  maybe_custom_vocoder_token = ?
        "#,
      // Insert
      &model_weight_token,
      record.ietf_language_tag,
      record.ietf_primary_language_subtag,
      record.text_pipeline_type,
      record.use_default_mel_multiply_factor,
      record.maybe_custom_mel_multiply_factor,
      record.maybe_default_pretrained_vocoder,
      record.maybe_custom_vocoder_token,

      // Update
      record.ietf_language_tag,
      record.ietf_primary_language_subtag,
      record.text_pipeline_type,
      record.use_default_mel_multiply_factor,
      record.maybe_custom_mel_multiply_factor,
      record.maybe_default_pretrained_vocoder,
      record.maybe_custom_vocoder_token
    );

  let _r = query.execute(&mut **transaction).await?;

  Ok(())
}

pub async fn update_original_record(
  record: &WholeTtsModelRecord,
  model_weight_token: &ModelWeightToken,
  transaction: &mut Transaction<'_, MySql>
) -> AnyhowResult<()> {
  let query = sqlx::query!(
        r#"
UPDATE tts_models
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
