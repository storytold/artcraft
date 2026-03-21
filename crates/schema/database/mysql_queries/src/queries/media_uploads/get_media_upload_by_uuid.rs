use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::media_uploads::media_upload_type::MediaUploadType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_uploads::MediaUploadToken;

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

/// Query for a media upload to see if we already uploaded it.
pub async fn get_media_upload_by_uuid(
  uuid_idempotency_token: &str,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<MediaUploadRecord>> {
  let mut connection = mysql_pool.acquire().await?;
  get_media_upload_by_uuid_with_connection(
    uuid_idempotency_token,
    &mut connection
  ).await
}

/// Query for a media upload to see if we already uploaded it.
pub async fn get_media_upload_by_uuid_with_connection(
  uuid_idempotency_token: &str,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Option<MediaUploadRecord>> {
  let maybe_result = sqlx::query_as!(
      RawMediaUploadRecord,
        r#"
SELECT
    mu.token as `token: tokens::tokens::media_uploads::MediaUploadToken`,
    mu.media_type as `media_type: enums_db::by_table::media_uploads::media_upload_type::MediaUploadType`,
    mu.maybe_original_filename,
    mu.original_file_size_bytes,
    mu.original_duration_millis,
    mu.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,
    mu.created_at,
    mu.updated_at
FROM media_uploads as mu
WHERE
    mu.uuid_idempotency_token = ?
    AND mu.user_deleted_at IS NULL
    AND mu.mod_deleted_at IS NULL
        "#,
    uuid_idempotency_token,
  )
      .fetch_one(&mut **mysql_connection)
      .await;

  match maybe_result {
    Err(err) => match err {
      sqlx::Error::RowNotFound => Ok(None),
      _ => {
        error!("list media uploads db error: {:?}", err);
        Err(anyhow!("error with query: {:?}", err))
      }
    },
    Ok(upload) => Ok(Some(MediaUploadRecord {
      token: upload.token,
      media_type: upload.media_type,
      maybe_original_filename: upload.maybe_original_filename,
      original_file_size_bytes: upload.original_file_size_bytes as u32,
      original_duration_millis: upload.original_duration_millis as u32,
      creator_set_visibility: upload.creator_set_visibility,
      created_at: upload.created_at,
      updated_at: upload.updated_at,
    }))
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
