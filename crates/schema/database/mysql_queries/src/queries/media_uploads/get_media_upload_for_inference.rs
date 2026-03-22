use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::media_uploads::media_upload_type::MediaUploadType;
use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_uploads::MediaUploadToken;

use crate::payloads::media_upload_modification_details::MediaUploadModificationDetails;

pub struct MediaUploadRecordForInference {
  pub token: MediaUploadToken,
  pub media_type: MediaUploadType,

  pub maybe_original_filename: Option<String>,

  pub public_bucket_directory_hash: String,

  pub original_file_size_bytes: u32,
  pub original_duration_millis: u32,

  pub maybe_extra_file_modification_info: Option<MediaUploadModificationDetails>,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// Query for a media upload to see if we already uploaded it.
pub async fn get_media_upload_for_inference(
  media_upload_token: &MediaUploadToken,
  mysql_pool: &MySqlPool,
) -> AnyhowResult<Option<MediaUploadRecordForInference>> {
  let mut connection = mysql_pool.acquire().await?;
  get_media_upload_by_uuid_with_connection(
    media_upload_token,
    &mut connection
  ).await
}

/// Query for a media upload to see if we already uploaded it.
pub async fn get_media_upload_by_uuid_with_connection(
  media_upload_token: &MediaUploadToken,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Option<MediaUploadRecordForInference>> {
  let maybe_result = sqlx::query_as!(
      RawMediaUploadRecord,
        r#"
SELECT
    mu.token as `token: tokens::tokens::media_uploads::MediaUploadToken`,
    mu.media_type as `media_type: enums_db::by_table::media_uploads::media_upload_type::MediaUploadType`,
    mu.maybe_original_filename,
    mu.public_bucket_directory_hash,
    mu.original_file_size_bytes,
    mu.original_duration_millis,
    mu.maybe_extra_file_modification_info,
    mu.creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,
    mu.created_at,
    mu.updated_at
FROM media_uploads as mu
WHERE
    mu.token = ?
    AND mu.user_deleted_at IS NULL
    AND mu.mod_deleted_at IS NULL
        "#,
    media_upload_token.as_str(),
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
    Ok(upload) => Ok(Some(MediaUploadRecordForInference {
      token: upload.token,
      media_type: upload.media_type,
      maybe_original_filename: upload.maybe_original_filename,
      public_bucket_directory_hash: upload.public_bucket_directory_hash,
      original_file_size_bytes: upload.original_file_size_bytes as u32,
      original_duration_millis: upload.original_duration_millis as u32,
      maybe_extra_file_modification_info: upload.maybe_extra_file_modification_info
          .as_deref()
          .filter(|info| !info.trim().is_empty())
          .map(|info| MediaUploadModificationDetails::from_json(info))
          .transpose()
          .map_err(|err| {
            anyhow!("Error parsing field `maybe_extra_file_modification_info` from JSON: {:?}", err)
          })?,
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

  pub public_bucket_directory_hash: String,

  pub original_file_size_bytes: i32,
  pub original_duration_millis: i32,

  pub maybe_extra_file_modification_info: Option<String>,

  pub creator_set_visibility: Visibility,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
