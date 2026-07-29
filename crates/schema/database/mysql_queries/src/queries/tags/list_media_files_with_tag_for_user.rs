use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

use crate::queries::media_files::list::media_file_list_row::MediaFileListRow;

pub struct ListMediaFilesWithTagForUserArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_token: &'e TagToken,
  pub owner_user_token: &'e UserToken,
  pub maybe_cursor_id: Option<u64>,
  pub limit: u32,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Paginated list of the user's media files carrying the given tag.
/// Excludes soft-deleted and intermediate system files. Newest first
/// (`media_files.id` descending; the id doubles as the cursor). The
/// join enters through `index_tag_token_and_user_token`, and the unique
/// key on `(media_file_token, tag_token, user_token)` guarantees at most
/// one link row per media file — no DISTINCT needed.
///
/// The caller is expected to have already verified the tag belongs to
/// the user (`get_tag_for_owner`) so a bad token can 404.
pub async fn list_media_files_with_tag_for_user<'e, 'c: 'e, E>(
  args: ListMediaFilesWithTagForUserArgs<'e, 'c, E>,
) -> Result<Vec<MediaFileListRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  // No-cursor requests use a sentinel above every possible id, which
  // keeps this to a single static query. (`media_files.id` is a signed
  // BIGINT, so the sentinel is i64::MAX rather than u64::MAX.)
  let cursor_id = args.maybe_cursor_id.unwrap_or(i64::MAX as u64);
  let limit = args.limit as i64;

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
FROM media_file_tags mft
JOIN media_files mf
  ON mf.token = mft.media_file_token
LEFT JOIN media_files cover
  ON cover.token = mf.maybe_cover_image_media_file_token
WHERE mft.tag_token = ?
  AND mft.user_token = ?
  AND mf.maybe_creator_user_token = ?
  AND mf.user_deleted_at IS NULL
  AND mf.mod_deleted_at IS NULL
  AND NOT mf.is_intermediate_system_file
  AND mf.id < ?
ORDER BY mf.id DESC
LIMIT ?
    "#,
    args.tag_token.as_str(),
    args.owner_user_token.as_str(),
    args.owner_user_token.as_str(),
    cursor_id,
    limit,
  )
    .fetch_all(args.mysql_executor)
    .await
}
