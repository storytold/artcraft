use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::media_uploads::media_upload_type::MediaUploadType;
use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_uploads::MediaUploadToken;
use tokens::tokens::users::UserToken;

pub struct MediaUploadRecord {
  pub token: MediaUploadToken,
  pub media_type: MediaUploadType,

  pub maybe_original_filename: Option<String>,

  pub original_file_size_bytes: u32,
  pub original_duration_millis: u32,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub async fn reverse_list_user_media_uploads_of_type(
  creator_user_token: &UserToken,
  media_upload_type: MediaUploadType,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Vec<MediaUploadRecord>> {
  let mut connection = mysql_pool.acquire().await?;
  reverse_list_user_media_uploads_of_type_with_connection(
    creator_user_token,
    media_upload_type,
    &mut connection
  ).await
}

pub async fn reverse_list_user_media_uploads_of_type_with_connection(
  creator_user_token: &UserToken,
  media_upload_type: MediaUploadType,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<MediaUploadRecord>> {
  let maybe_results = sqlx::query_as!(
      RawMediaUploadRecord,
        r#"
SELECT
    mu.token as `token: tokens::tokens::media_uploads::MediaUploadToken`,
    mu.media_type as `media_type: enums_db::by_table::media_uploads::media_upload_type::MediaUploadType`,
    mu.maybe_original_filename,
    mu.original_file_size_bytes,
    mu.original_duration_millis,
    mu.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
    mu.created_at,
    mu.updated_at
FROM media_uploads as mu
WHERE
    mu.maybe_creator_user_token = ?
    AND mu.maybe_creator_user_token IS NOT NULL
    AND mu.media_type = ?
    AND mu.user_deleted_at IS NULL
    AND mu.mod_deleted_at IS NULL
ORDER BY id DESC
LIMIT 25
        "#,
    creator_user_token,
    media_upload_type.to_str(),
  )
          .fetch_all(&mut **mysql_connection)
          .await;

  match maybe_results {
    Err(err) => match err {
      sqlx::Error::RowNotFound => Ok(Vec::new()),
      _ => {
        error!("list media uploads db error: {:?}", err);
        Err(anyhow!("error with query: {:?}", err))
      }
    },
    Ok(results) => Ok(results.into_iter()
        .map(|upload| MediaUploadRecord {
          token: upload.token,
          media_type: upload.media_type,
          maybe_original_filename: upload.maybe_original_filename,
          original_file_size_bytes: upload.original_file_size_bytes as u32,
          original_duration_millis: upload.original_duration_millis as u32,
          creator_set_visibility: upload.creator_set_visibility,
          created_at: upload.created_at,
          updated_at: upload.updated_at,
        })
        .collect()),
  }
}

struct RawMediaUploadRecord {
  pub token: MediaUploadToken,
  pub media_type: MediaUploadType,

  pub maybe_original_filename: Option<String>,

  pub original_file_size_bytes: i32,
  pub original_duration_millis: i32,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
