use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::by_table::model_weights::weights_category::WeightsCategory;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;

pub struct CreateModelWeightArgs<'a> {
  pub maybe_use_model_weights_token: Option<ModelWeightToken>,
  pub maybe_old_voice_conversion_model_token: Option<VoiceConversionModelToken>,

  pub weights_type: WeightsType,
  pub weights_category: WeightsCategory,

  pub title: &'a str,

  pub original_download_url: &'a str,
  pub original_filename: &'a str,
  pub file_size_bytes: u64,
  pub file_checksum_sha2: &'a str,

  pub creator_user_token: &'a UserToken,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  /// (For rvc_v2 models) - whether the model has an associated `.index` file.
  pub has_index_file: bool,

  pub public_bucket_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub mysql_pool: &'a MySqlPool,
}

pub async fn create_model_weight_from_voice_conversion_download_job(
  args: CreateModelWeightArgs<'_>,
) -> AnyhowResult<(u64, ModelWeightToken)> {

  let weights_token = args.maybe_use_model_weights_token
      .map(|token| token.clone())
      .unwrap_or_else(|| ModelWeightToken::generate());

  let mut transaction = args.mysql_pool.begin().await?;

  // NB: Not setting the following:
  // - created_at
  // - updated_at
  // - user_deleted_at
  // - mod_deleted_at
  // - version = 0

  let query_result = sqlx::query!(
        r#"
INSERT INTO model_weights
SET
  token = ?,
  weights_type = ?,
  weights_category = ?,
  title = ?,

  maybe_cover_image_media_file_token = NULL,
  maybe_description_markdown = NULL,
  maybe_description_rendered_html = NULL,

  maybe_last_update_user_token = NULL,
  original_download_url = ?,
  original_filename = ?,
  file_size_bytes = ?,
  file_checksum_sha2 = ?,

  creator_user_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,

  public_bucket_hash = ?,
  maybe_public_bucket_prefix = ?,
  maybe_public_bucket_extension = ?,

  maybe_migration_old_model_token = ?
        "#,
      &weights_token,
      args.weights_type,
      args.weights_category,
      args.title,

      args.original_download_url,
      args.original_filename,
      args.file_size_bytes,
      args.file_checksum_sha2,

      args.creator_user_token,
      args.creator_ip_address,
      args.creator_set_visibility.to_str(),

      args.public_bucket_hash,
      args.maybe_public_bucket_prefix,
      args.maybe_public_bucket_extension,

      args.maybe_old_voice_conversion_model_token,
    )
      .execute(&mut *transaction)
      .await;

  let model_weights_record_id = match query_result {
    Ok(res) => res.last_insert_id(),
    Err(err) => return Err(anyhow!("Mysql error: {:?}", err)),
  };

  let query_result = sqlx::query!(
        r#"
INSERT INTO model_weights_extension_voice_conversion_details
SET
  model_weights_token = ?,
  has_index_file = ?
        "#,
      &weights_token,
      args.has_index_file
    )
      .execute(&mut *transaction)
      .await;

  match query_result {
    Ok(_res) => {},
    Err(err) => return Err(anyhow!("Mysql error: {:?}", err)),
  };

  transaction.commit().await?;

  Ok((model_weights_record_id, weights_token))
}
