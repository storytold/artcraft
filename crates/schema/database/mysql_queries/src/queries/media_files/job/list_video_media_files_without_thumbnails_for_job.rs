use anyhow::anyhow;
use chrono::{TimeDelta, Utc};
use log::warn;
use sqlx::MySqlPool;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use tokens::tokens::media_files::MediaFileToken;

use errors::AnyhowResult;

/// The serialized value for `MediaFileClass::Video` as stored in the database.
const MEDIA_CLASS_VIDEO: &str = MediaFileClass::Video.to_str();
const PAGE_SIZE: i64 = 100;

pub struct ListVideoMediaFilesWithoutThumbnailsArgs<'a> {
  pub time_delta: TimeDelta,
  pub maybe_id_cursor: Option<i64>,
  pub pool: &'a MySqlPool,
}

pub struct VideoMediaFileWithoutThumbnail {
  pub token: MediaFileToken,
  pub maybe_thumbnail_version: Option<u8>,
  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,
}

pub struct VideoMediaFilesWithoutThumbnails {
  pub media_files: Vec<VideoMediaFileWithoutThumbnail>,
  pub next_cursor: Option<i64>,
}

pub async fn list_video_media_files_without_thumbnails_for_job(
  args: ListVideoMediaFilesWithoutThumbnailsArgs<'_>,
) -> AnyhowResult<VideoMediaFilesWithoutThumbnails> {
  let cutoff = Utc::now() - args.time_delta;
  let cursor = args.maybe_id_cursor.unwrap_or(i64::MAX);

  let rows = sqlx::query_as!(
    VideoMediaFileWithoutThumbnail,
    r#"
SELECT
    token as `token: MediaFileToken`,
    maybe_thumbnail_version as `maybe_thumbnail_version: u8`,
    public_bucket_directory_hash,
    maybe_public_bucket_prefix,
    maybe_public_bucket_extension
FROM media_files
WHERE
    media_class = ?
    AND created_at >= ?
    AND maybe_thumbnail_version IS NULL
    AND id < ?
    AND user_deleted_at IS NULL
    AND mod_deleted_at IS NULL
ORDER BY id DESC
LIMIT ?
    "#,
    MEDIA_CLASS_VIDEO,
    cutoff,
    cursor,
    PAGE_SIZE,
  )
    .fetch_all(args.pool)
    .await;

  match rows {
    Ok(media_files) => {
      let next_cursor = if media_files.len() as i64 == PAGE_SIZE {
        // We need the id of the last row for the next cursor.
        // Since we don't select `id`, we re-query for just the id of the last token.
        let last_token = &media_files.last().unwrap().token;
        let id_row = sqlx::query_scalar!(
          r#"SELECT id FROM media_files WHERE token = ? LIMIT 1"#,
          last_token.as_str(),
        )
          .fetch_one(args.pool)
          .await;

        match id_row {
          Ok(id) => Some(id),
          Err(err) => {
            warn!("Failed to fetch cursor id for token {:?}: {:?}", last_token, err);
            None
          }
        }
      } else {
        None
      };

      Ok(VideoMediaFilesWithoutThumbnails { media_files, next_cursor })
    }
    Err(err) => {
      warn!("list_video_media_files_without_thumbnails_for_job query error: {:?}", err);
      Err(anyhow!("query error"))
    }
  }
}
