use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct FolderMediaFileRow {
  /// The `folder_media_files.id` of the membership row. Use this as the
  /// cursor for the next page.
  pub membership_id: u64,

  /// When the media file was added to the folder.
  pub added_to_folder_at: DateTime<Utc>,

  pub media_file_token: MediaFileToken,
  pub media_type: String,
  pub media_class: String,
  pub maybe_mime_type: Option<String>,
  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,
  pub maybe_frame_width: Option<i32>,
  pub maybe_frame_height: Option<i32>,
  pub maybe_duration_millis: Option<i32>,
  pub maybe_title: Option<String>,
}

pub struct ListFolderMediaFilesArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub folder_token: &'e FolderToken,
  pub maybe_cursor_id: Option<u64>,
  pub limit: u32,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Paginated list of media files in the given folder. Joins `media_files`
/// and filters out rows that are soft-deleted on the media-file side.
/// Most-recently-added first. The caller is expected to have already
/// authorized the folder access.
pub async fn list_folder_media_files<'e, 'c: 'e, E>(
  args: ListFolderMediaFilesArgs<'e, 'c, E>,
) -> Result<Vec<FolderMediaFileRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let limit = args.limit as i64;

  let rows = match args.maybe_cursor_id {
    Some(cursor_id) => {
      sqlx::query!(
        r#"
SELECT
  fmf.id as `membership_id: u64`,
  fmf.created_at as `added_to_folder_at: DateTime<Utc>`,
  mf.token as `media_file_token: MediaFileToken`,
  mf.media_type,
  mf.media_class,
  mf.maybe_mime_type,
  mf.public_bucket_directory_hash,
  mf.maybe_public_bucket_prefix,
  mf.maybe_public_bucket_extension,
  mf.maybe_frame_width,
  mf.maybe_frame_height,
  mf.maybe_duration_millis,
  mf.maybe_title
FROM folder_media_files fmf
JOIN media_files mf
  ON mf.token = fmf.media_file_token
WHERE fmf.folder_token = ?
  AND mf.user_deleted_at IS NULL
  AND mf.mod_deleted_at IS NULL
  AND fmf.id < ?
ORDER BY fmf.id DESC
LIMIT ?
        "#,
        args.folder_token.as_str(),
        cursor_id,
        limit,
      )
        .fetch_all(args.mysql_executor)
        .await?
        .into_iter()
        .map(|r| FolderMediaFileRow {
          membership_id: r.membership_id,
          added_to_folder_at: r.added_to_folder_at,
          media_file_token: r.media_file_token,
          media_type: r.media_type,
          media_class: r.media_class,
          maybe_mime_type: r.maybe_mime_type,
          public_bucket_directory_hash: r.public_bucket_directory_hash,
          maybe_public_bucket_prefix: r.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: r.maybe_public_bucket_extension,
          maybe_frame_width: r.maybe_frame_width,
          maybe_frame_height: r.maybe_frame_height,
          maybe_duration_millis: r.maybe_duration_millis,
          maybe_title: r.maybe_title,
        })
        .collect::<Vec<_>>()
    }
    None => {
      sqlx::query!(
        r#"
SELECT
  fmf.id as `membership_id: u64`,
  fmf.created_at as `added_to_folder_at: DateTime<Utc>`,
  mf.token as `media_file_token: MediaFileToken`,
  mf.media_type,
  mf.media_class,
  mf.maybe_mime_type,
  mf.public_bucket_directory_hash,
  mf.maybe_public_bucket_prefix,
  mf.maybe_public_bucket_extension,
  mf.maybe_frame_width,
  mf.maybe_frame_height,
  mf.maybe_duration_millis,
  mf.maybe_title
FROM folder_media_files fmf
JOIN media_files mf
  ON mf.token = fmf.media_file_token
WHERE fmf.folder_token = ?
  AND mf.user_deleted_at IS NULL
  AND mf.mod_deleted_at IS NULL
ORDER BY fmf.id DESC
LIMIT ?
        "#,
        args.folder_token.as_str(),
        limit,
      )
        .fetch_all(args.mysql_executor)
        .await?
        .into_iter()
        .map(|r| FolderMediaFileRow {
          membership_id: r.membership_id,
          added_to_folder_at: r.added_to_folder_at,
          media_file_token: r.media_file_token,
          media_type: r.media_type,
          media_class: r.media_class,
          maybe_mime_type: r.maybe_mime_type,
          public_bucket_directory_hash: r.public_bucket_directory_hash,
          maybe_public_bucket_prefix: r.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: r.maybe_public_bucket_extension,
          maybe_frame_width: r.maybe_frame_width,
          maybe_frame_height: r.maybe_frame_height,
          maybe_duration_millis: r.maybe_duration_millis,
          maybe_title: r.maybe_title,
        })
        .collect::<Vec<_>>()
    }
  };

  Ok(rows)
}
