// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

#[derive(Serialize, Debug)]
pub struct MediaFileForInference {
  pub token: MediaFileToken,

  pub media_type: MediaFileType,

  pub maybe_creator_user_token: Option<UserToken>,
  pub creator_set_visibility: Visibility,

  pub file_size_bytes: u32,
  pub maybe_duration_millis: Option<u32>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,
}

#[derive(Serialize)]
pub struct MediaFileRaw {
  pub token: MediaFileToken,

  pub media_type: MediaFileType,

  pub maybe_creator_user_token: Option<UserToken>,
  pub creator_set_visibility: Visibility,

  pub file_size_bytes: i32,
  pub maybe_duration_millis: Option<i32>,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,
}

pub async fn get_media_file_for_inference(
  media_file_token: &MediaFileToken,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<MediaFileForInference>> {

  let record = select_record(media_file_token, mysql_pool).await;

  let record = match record {
    Ok(record) => record,
    Err(ref err) => {
      return match err {
        sqlx::Error::RowNotFound => Ok(None),
        _ => Err(anyhow!("database error: {:?}", err)),
      }
    }
  };

  Ok(Some(MediaFileForInference {
    token: record.token,
    media_type: record.media_type,
    maybe_creator_user_token: record.maybe_creator_user_token,
    creator_set_visibility: record.creator_set_visibility,
    file_size_bytes: record.file_size_bytes as u32,
    maybe_duration_millis: record.maybe_duration_millis.map(|i| i as u32),
    public_bucket_directory_hash: record.public_bucket_directory_hash,
    maybe_public_bucket_prefix: record.maybe_public_bucket_prefix,
    maybe_public_bucket_extension: record.maybe_public_bucket_extension,
  }))
}

async fn select_record(
  media_file_token: &MediaFileToken,
  mysql_pool: &MySqlPool
) -> Result<MediaFileRaw, sqlx::Error> {
  sqlx::query_as!(
      MediaFileRaw,
        r#"
SELECT
    m.token as `token: tokens::tokens::media_files::MediaFileToken`,

    m.media_type as `media_type: enums_db::by_table::media_files::media_file_type::MediaFileType`,

    m.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

    m.file_size_bytes,
    m.maybe_duration_millis,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension

FROM media_files AS m
WHERE
    m.token = ?
        "#,
      media_file_token
    )
    .fetch_one(mysql_pool)
    .await
}
