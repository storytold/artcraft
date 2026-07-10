use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::queries::media_files::list::media_file_list_row::MediaFileListRow;

/// One folder-media-file row: the shared media-file list fields plus
/// folder-membership metadata.
#[derive(Debug, Clone)]
pub struct FolderMediaFileRow {
  /// The common media-file list fields (identity, bucket/cover fields,
  /// dimensions, timestamps). `media.media_file_id` is the pagination
  /// cursor — the list is sorted by it (descending) rather than by
  /// folder-membership order so the frontend's group-by-date view
  /// doesn't interleave across pages.
  pub media: MediaFileListRow,

  /// When the media file was added to the folder.
  pub added_to_folder_at: DateTime<Utc>,

  pub is_intermediate_system_file: bool,
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
/// for the file's own metadata and LEFT JOINs `media_files` again on
/// `maybe_cover_image_media_file_token` so the cover-image bucket fields
/// come back in a single round-trip. Filters out media files that are
/// soft-deleted on the media-file side. Newest media files first
/// (`media_files.id` descending — NOT folder-membership order).
///
/// The caller is expected to have already authorized the folder access.
pub async fn list_folder_media_files<'e, 'c: 'e, E>(
  args: ListFolderMediaFilesArgs<'e, 'c, E>,
) -> Result<Vec<FolderMediaFileRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  // No-cursor requests use a sentinel above every possible id, which
  // keeps this to a single static query. (`media_files.id` is a signed
  // BIGINT, so the sentinel is i64::MAX rather than u64::MAX.)
  let cursor_id = args.maybe_cursor_id.unwrap_or(i64::MAX as u64);
  let limit = args.limit as i64;

  let rows = sqlx::query!(
    r#"
SELECT
  mf.id as `media_file_id: u64`,
  fmf.created_at as `added_to_folder_at: DateTime<Utc>`,

  mf.token as `media_file_token: MediaFileToken`,
  mf.media_class as `media_class: MediaFileClass`,
  mf.media_type as `media_type: MediaFileType`,

  mf.maybe_batch_token as `maybe_batch_token: BatchGenerationToken`,

  mf.public_bucket_directory_hash,
  mf.maybe_public_bucket_prefix,
  mf.maybe_public_bucket_extension,

  cover.public_bucket_directory_hash as `maybe_cover_public_bucket_directory_hash?`,
  cover.maybe_public_bucket_prefix as `maybe_cover_public_bucket_prefix?`,
  cover.maybe_public_bucket_extension as `maybe_cover_public_bucket_extension?`,

  mf.creator_set_visibility as `creator_set_visibility: Visibility`,
  mf.is_user_upload as `is_user_upload: bool`,
  mf.is_intermediate_system_file as `is_intermediate_system_file: bool`,

  mf.maybe_title,
  mf.maybe_prompt_token as `maybe_prompt_token: PromptToken`,
  mf.maybe_origin_filename,

  mf.maybe_duration_millis,
  mf.maybe_frame_width,
  mf.maybe_frame_height,

  mf.created_at,
  mf.updated_at
FROM folder_media_files fmf
JOIN media_files mf
  ON mf.token = fmf.media_file_token
LEFT JOIN media_files cover
  ON cover.token = mf.maybe_cover_image_media_file_token
WHERE fmf.folder_token = ?
  AND mf.user_deleted_at IS NULL
  AND mf.mod_deleted_at IS NULL
  AND mf.id < ?
ORDER BY mf.id DESC
LIMIT ?
    "#,
    args.folder_token.as_str(),
    cursor_id,
    limit,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows.into_iter()
    .map(|r| FolderMediaFileRow {
      added_to_folder_at: r.added_to_folder_at,
      is_intermediate_system_file: r.is_intermediate_system_file,
      media: MediaFileListRow {
        media_file_id: r.media_file_id,
        media_file_token: r.media_file_token,
        media_class: r.media_class,
        media_type: r.media_type,
        maybe_batch_token: r.maybe_batch_token,
        public_bucket_directory_hash: r.public_bucket_directory_hash,
        maybe_public_bucket_prefix: r.maybe_public_bucket_prefix,
        maybe_public_bucket_extension: r.maybe_public_bucket_extension,
        maybe_cover_public_bucket_directory_hash: r.maybe_cover_public_bucket_directory_hash,
        maybe_cover_public_bucket_prefix: r.maybe_cover_public_bucket_prefix,
        maybe_cover_public_bucket_extension: r.maybe_cover_public_bucket_extension,
        creator_set_visibility: r.creator_set_visibility,
        is_user_upload: r.is_user_upload,
        maybe_title: r.maybe_title,
        maybe_prompt_token: r.maybe_prompt_token,
        maybe_origin_filename: r.maybe_origin_filename,
        maybe_duration_millis: r.maybe_duration_millis,
        maybe_frame_width: r.maybe_frame_width,
        maybe_frame_height: r.maybe_frame_height,
        created_at: r.created_at,
        updated_at: r.updated_at,
      },
    })
    .collect())
}
