// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::path::Path;

use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use enums_db::common::vocoder_type::VocoderType;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;
use tokens::tokens::vocoder_models::VocoderModelToken;

pub struct Args<'a, P: AsRef<Path>> {
  pub vocoder_type: VocoderType,

  pub title: &'a str,

  pub original_download_url: &'a str,
  pub original_filename: &'a str,
  pub file_size_bytes: u64,

  pub creator_user_token: &'a UserToken,
  pub creator_ip_address: &'a str,
  pub creator_set_visibility: Visibility,

  pub private_bucket_hash: &'a str,
  pub private_bucket_object_name: P,

  pub mysql_pool: &'a MySqlPool,
}

pub async fn insert_vocoder_model<P: AsRef<Path>>(
  args: Args<'_, P>,
) -> AnyhowResult<(u64, String)> {

  let model_token = VocoderModelToken::generate().to_string();

  let private_bucket_object_name = &args.private_bucket_object_name
      .as_ref()
      .display()
      .to_string();

  let query_result = sqlx::query!(
        r#"
INSERT INTO vocoder_models
SET
  token = ?,
  vocoder_type = ?,
  title = ?,
  description_markdown = '',
  description_rendered_html = '',
  original_download_url = ?,
  original_filename = ?,
  file_size_bytes = ?,
  creator_user_token = ?,
  creator_ip_address_creation = ?,
  creator_ip_address_last_update = ?,
  creator_set_visibility = ?,
  private_bucket_hash = ?,
  private_bucket_object_name = ?
        "#,
      &model_token,
      args.vocoder_type.to_str(),
      &args.title,
      &args.original_download_url,
      &args.original_filename,
      args.file_size_bytes,
      &args.creator_user_token,
      &args.creator_ip_address,
      &args.creator_ip_address,
      args.creator_set_visibility.to_str(),
      args.private_bucket_hash,
      private_bucket_object_name,
    )
      .execute(args.mysql_pool)
      .await;

  let record_id = match query_result {
    Ok(res) => {
      res.last_insert_id()
    },
    Err(err) => {
      return Err(anyhow!("Mysql error: {:?}", err));
    }
  };

  Ok((record_id, model_token))
}
