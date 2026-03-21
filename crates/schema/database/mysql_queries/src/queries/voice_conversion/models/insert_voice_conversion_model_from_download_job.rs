use std::path::Path;

use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;

pub struct InsertVoiceConversionModelArgs<'a, P: AsRef<Path>> {
  pub model_type: VoiceConversionModelType,

  pub maybe_new_weights_token: Option<&'a ModelWeightToken>,

  pub title: &'a str,

  pub original_download_url: &'a str,
  pub original_filename: &'a str,
  pub file_size_bytes: u64,

  pub creator_user_token: &'a UserToken,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  /// (For rvc_v2 models) - whether the model has an associated `.index` file.
  pub has_index_file: bool,

  pub private_bucket_hash: &'a str,
  pub private_bucket_object_name: P,

  pub mysql_pool: &'a MySqlPool,
}


pub async fn insert_voice_conversion_model_from_download_job<P: AsRef<Path>>(
  args: InsertVoiceConversionModelArgs<'_, P>,
) -> AnyhowResult<(u64, VoiceConversionModelToken)> {

  let model_token = VoiceConversionModelToken::generate();

  let private_bucket_object_name = &args.private_bucket_object_name
      .as_ref()
      .display()
      .to_string();

  // NB: 'rocket_vc' is codename for 'softvc'
  let query_result = sqlx::query!(
        r#"
INSERT INTO voice_conversion_models
SET
  token = ?,
  model_type = ?,
  title = ?,
  description_markdown = '',
  description_rendered_html = '',
  creator_user_token = ?,
  ip_address_creation = ?,
  ip_address_last_update = ?,
  original_download_url = ?,
  has_index_file = ?,
  private_bucket_hash = ?,
  private_bucket_object_name = ?,
  file_size_bytes = ?,
  maybe_migration_new_model_weights_token = ?
        "#,
      &model_token,
      args.model_type.to_str(),
      args.title,
      args.creator_user_token,
      args.creator_ip_address,
      args.creator_ip_address,
      args.original_download_url,
      args.has_index_file,
      args.private_bucket_hash,
      private_bucket_object_name,
      args.file_size_bytes,
      args.maybe_new_weights_token,
    )
      .execute(args.mysql_pool)
      .await;

  let record_id = match query_result {
    Ok(res) => res.last_insert_id(),
    Err(err) => return Err(anyhow!("Mysql error: {:?}", err)),
  };

  Ok((record_id, model_token))
}
