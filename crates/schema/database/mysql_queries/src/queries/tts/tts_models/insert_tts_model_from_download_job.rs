use std::path::Path;

use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::by_table::tts_models::tts_model_type::TtsModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::users::UserToken;

pub struct InsertTtsModelFromDownloadJobArgs<'a, P: AsRef<Path>> {
  pub tts_model_type: TtsModelType,

  pub title: &'a str,

  pub original_download_url: &'a str,
  pub original_filename: &'a str,
  pub file_size_bytes: u64,

  pub creator_user_token: &'a UserToken,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  pub private_bucket_hash: &'a str,
  pub private_bucket_object_name: P,

  /// In production code, send this as `None`.
  /// Only provide an external model token for db integration tests and db seeding tools.
  /// This allows for knowing the model token a priori.
  pub maybe_model_token: Option<&'a TtsModelToken>,

  pub mysql_pool: &'a MySqlPool,
}


pub async fn insert_tts_model_from_download_job<P: AsRef<Path>>(
  args: InsertTtsModelFromDownloadJobArgs<'_, P>,
) -> AnyhowResult<(u64, TtsModelToken)> {

  let model_token = match args.maybe_model_token {
    None => TtsModelToken::generate(),
    Some(model_token) => model_token.clone(),
  };

  let private_bucket_object_name = &args.private_bucket_object_name
      .as_ref()
      .display()
      .to_string();

  let query_result = sqlx::query!(
        r#"
INSERT INTO tts_models
SET
  token = ?,
  tts_model_type = ?,
  title = ?,
  description_markdown = '',
  description_rendered_html = '',
  creator_user_token = ?,
  creator_ip_address_creation = ?,
  creator_ip_address_last_update = ?,
  original_download_url = ?,
  private_bucket_hash = ?,
  private_bucket_object_name = ?,
  file_size_bytes = ?
        "#,
      &model_token,
      args.tts_model_type,
      args.title,
      args.creator_user_token,
      args.creator_ip_address,
      args.creator_ip_address,
      args.original_download_url,
      args.private_bucket_hash,
      private_bucket_object_name,
      args.file_size_bytes
    )
      .execute(args.mysql_pool)
      .await;

  let record_id = match query_result {
    Ok(res) => res.last_insert_id(),
    Err(err) => return Err(anyhow!("Mysql error: {:?}", err)),
  };

  Ok((record_id, model_token))
}
