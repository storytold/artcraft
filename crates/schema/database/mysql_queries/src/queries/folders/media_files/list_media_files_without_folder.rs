use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::queries::media_files::list::media_file_list_row::MediaFileListRow;

pub struct ListMediaFilesWithoutFolderArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub owner_user_token: &'e UserToken,

  /// Optional filter on the coarse media class (image / video / mesh / ...).
  pub maybe_filter_media_class: Option<MediaFileClass>,

  pub maybe_cursor_id: Option<u64>,
  pub limit: u32,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Paginated list of the user's media files that sit in no folder at all.
/// Memberships whose folder was soft-deleted (but whose link row wasn't
/// cleaned up) count as unfoldered. Excludes soft-deleted and intermediate
/// system files. Newest first (`media_files.id` descending; the id doubles
/// as the cursor).
///
/// The NOT EXISTS probe is a point lookup on
/// `folder_media_files.index_media_file_token` plus a primary-key lookup
/// on `folders` for the soft-delete check — cheap per candidate row.
pub async fn list_media_files_without_folder<'e, 'c: 'e, E>(
  args: ListMediaFilesWithoutFolderArgs<'e, 'c, E>,
) -> Result<Vec<MediaFileListRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  // No-cursor requests use a sentinel above every possible id, which
  // keeps this to a single static query per filter variant.
  // (`media_files.id` is a signed BIGINT, so the sentinel is i64::MAX.)
  let cursor_id = args.maybe_cursor_id.unwrap_or(i64::MAX as u64);
  let limit = args.limit as i64;

  match args.maybe_filter_media_class {
    Some(media_class) => {
      select_page_with_class_filter(
        args.owner_user_token,
        media_class,
        cursor_id,
        limit,
        args.mysql_executor,
      ).await
    }
    None => {
      select_page_all_classes(
        args.owner_user_token,
        cursor_id,
        limit,
        args.mysql_executor,
      ).await
    }
  }
}

// NB: The two queries below are intentionally duplicated so that sqlx can
// check them at compile time (no QueryBuilder). Keep the SELECT lists and
// predicates in sync; they differ only in the `media_class = ?` filter.

async fn select_page_all_classes<'e, 'c: 'e, E>(
  owner_user_token: &'e UserToken,
  cursor_id: u64,
  limit: i64,
  mysql_executor: E,
) -> Result<Vec<MediaFileListRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  sqlx::query_as!(
    MediaFileListRow,
    r#"
SELECT
  mf.id as `media_file_id: u64`,

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

  mf.maybe_title,
  mf.maybe_prompt_token as `maybe_prompt_token: PromptToken`,
  mf.maybe_origin_filename,

  mf.maybe_duration_millis,
  mf.maybe_frame_width,
  mf.maybe_frame_height,

  mf.created_at,
  mf.updated_at
FROM media_files mf
LEFT JOIN media_files cover
  ON cover.token = mf.maybe_cover_image_media_file_token
WHERE mf.maybe_creator_user_token = ?
  AND mf.user_deleted_at IS NULL
  AND mf.mod_deleted_at IS NULL
  AND NOT mf.is_intermediate_system_file
  AND NOT EXISTS (
    SELECT 1
    FROM folder_media_files fmf
    JOIN folders f
      ON f.token = fmf.folder_token
      AND f.maybe_deleted_at IS NULL
    WHERE fmf.media_file_token = mf.token
  )
  AND mf.id < ?
ORDER BY mf.id DESC
LIMIT ?
    "#,
    owner_user_token.as_str(),
    cursor_id,
    limit,
  )
    .fetch_all(mysql_executor)
    .await
}

async fn select_page_with_class_filter<'e, 'c: 'e, E>(
  owner_user_token: &'e UserToken,
  media_class: MediaFileClass,
  cursor_id: u64,
  limit: i64,
  mysql_executor: E,
) -> Result<Vec<MediaFileListRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  sqlx::query_as!(
    MediaFileListRow,
    r#"
SELECT
  mf.id as `media_file_id: u64`,

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

  mf.maybe_title,
  mf.maybe_prompt_token as `maybe_prompt_token: PromptToken`,
  mf.maybe_origin_filename,

  mf.maybe_duration_millis,
  mf.maybe_frame_width,
  mf.maybe_frame_height,

  mf.created_at,
  mf.updated_at
FROM media_files mf
LEFT JOIN media_files cover
  ON cover.token = mf.maybe_cover_image_media_file_token
WHERE mf.maybe_creator_user_token = ?
  AND mf.media_class = ?
  AND mf.user_deleted_at IS NULL
  AND mf.mod_deleted_at IS NULL
  AND NOT mf.is_intermediate_system_file
  AND NOT EXISTS (
    SELECT 1
    FROM folder_media_files fmf
    JOIN folders f
      ON f.token = fmf.folder_token
      AND f.maybe_deleted_at IS NULL
    WHERE fmf.media_file_token = mf.token
  )
  AND mf.id < ?
ORDER BY mf.id DESC
LIMIT ?
    "#,
    owner_user_token.as_str(),
    media_class.to_str(),
    cursor_id,
    limit,
  )
    .fetch_all(mysql_executor)
    .await
}
