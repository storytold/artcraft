use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

pub struct SessionMediaFileListPage {
  pub records: Vec<SessionMediaFileListItem>,

  /// ID of the first record (for building the "previous" cursor).
  pub first_id: Option<u64>,

  /// ID of the last record (for building the "next" cursor).
  pub last_id: Option<u64>,
}

pub struct SessionMediaFileListItem {
  pub id: u64,
  pub token: MediaFileToken,

  pub media_class: MediaFileClass,
  pub media_type: MediaFileType,

  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,

  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  pub maybe_creator_gravatar_hash: Option<String>,

  pub maybe_file_cover_image_public_bucket_hash: Option<String>,
  pub maybe_file_cover_image_public_bucket_prefix: Option<String>,
  pub maybe_file_cover_image_public_bucket_extension: Option<String>,

  pub creator_set_visibility: Visibility,

  pub maybe_title: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct ListSessionMediaFilesByClassArgs<'a, 'c, E>
where
  E: 'a + Executor<'c, Database = MySql>,
{
  pub user_token: &'a UserToken,

  /// The media class to list (e.g. `mesh` or `splat`).
  pub media_class: MediaFileClass,

  pub limit: usize,

  /// Keyset cursor: a `media_files.id` from a previous page.
  pub maybe_cursor_id: Option<u64>,
  pub cursor_is_reversed: bool,
  pub sort_ascending: bool,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// List the session user's media files of a single class (e.g. `mesh` or
/// `splat`), newest first by default, with keyset pagination on `id`.
pub async fn list_session_media_files_by_class<'a, 'c: 'a, E>(
  args: ListSessionMediaFilesByClassArgs<'a, 'c, E>,
) -> Result<SessionMediaFileListPage, sqlx::Error>
where
  E: 'a + Executor<'c, Database = MySql>,
{
  // A reversed cursor walks the opposite direction of the sort, so the effective
  // scan direction is the XOR of the two flags (same scheme as `list_media_files`).
  let ascending = args.sort_ascending != args.cursor_is_reversed;

  let limit = args.limit as u64;

  let records = if ascending {
    // NB: IDs start at 1, so a zero sentinel means "no cursor".
    let cursor_id = args.maybe_cursor_id.unwrap_or(0);
    select_page_ascending(
      args.user_token,
      args.media_class,
      cursor_id,
      limit,
      args.mysql_executor,
    ).await?
  } else {
    let cursor_id = args.maybe_cursor_id.unwrap_or(u64::MAX);
    select_page_descending(
      args.user_token,
      args.media_class,
      cursor_id,
      limit,
      args.mysql_executor,
    ).await?
  };

  let first_id = records.first().map(|record| record.id);
  let last_id = records.last().map(|record| record.id);

  Ok(SessionMediaFileListPage {
    records,
    first_id,
    last_id,
  })
}

// NB: The two queries below are intentionally duplicated so that sqlx can check
// them at compile time (no QueryBuilder). Keep the SELECT lists and predicates
// in sync; they differ only in the cursor comparison direction and sort order.

async fn select_page_ascending<'a, 'c: 'a, E>(
  user_token: &'a UserToken,
  media_class: MediaFileClass,
  cursor_id: u64,
  limit: u64,
  mysql_executor: E,
) -> Result<Vec<SessionMediaFileListItem>, sqlx::Error>
where
  E: 'a + Executor<'c, Database = MySql>,
{
  sqlx::query_as!(
      SessionMediaFileListItem,
      r#"
SELECT
    m.id as `id: u64`,
    m.token as `token: tokens::tokens::media_files::MediaFileToken`,

    m.media_class as `media_class: enums::by_table::media_files::media_file_class::MediaFileClass`,
    m.media_type as `media_type: enums::by_table::media_files::media_file_type::MediaFileType`,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,

    media_file_cover_image.public_bucket_directory_hash as maybe_file_cover_image_public_bucket_hash,
    media_file_cover_image.maybe_public_bucket_prefix as maybe_file_cover_image_public_bucket_prefix,
    media_file_cover_image.maybe_public_bucket_extension as maybe_file_cover_image_public_bucket_extension,

    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

    m.maybe_title,

    m.created_at,
    m.updated_at

FROM media_files AS m FORCE INDEX (fk_maybe_creator_user_token)
LEFT OUTER JOIN users
    ON m.maybe_creator_user_token = users.token
LEFT OUTER JOIN media_files as media_file_cover_image
    ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
WHERE
    m.maybe_creator_user_token = ?
    AND m.media_class = ?
    AND m.user_deleted_at IS NULL
    AND m.mod_deleted_at IS NULL
    AND NOT m.is_intermediate_system_file
    AND m.id > ?
ORDER BY m.id ASC
LIMIT ?
      "#,
      user_token,
      media_class.to_str(),
      cursor_id,
      limit,
    )
      .fetch_all(mysql_executor)
      .await
}

async fn select_page_descending<'a, 'c: 'a, E>(
  user_token: &'a UserToken,
  media_class: MediaFileClass,
  cursor_id: u64,
  limit: u64,
  mysql_executor: E,
) -> Result<Vec<SessionMediaFileListItem>, sqlx::Error>
where
  E: 'a + Executor<'c, Database = MySql>,
{
  sqlx::query_as!(
      SessionMediaFileListItem,
      r#"
SELECT
    m.id as `id: u64`,
    m.token as `token: tokens::tokens::media_files::MediaFileToken`,

    m.media_class as `media_class: enums::by_table::media_files::media_file_class::MediaFileClass`,
    m.media_type as `media_type: enums::by_table::media_files::media_file_type::MediaFileType`,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension,

    users.token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,
    users.email_gravatar_hash as maybe_creator_gravatar_hash,

    media_file_cover_image.public_bucket_directory_hash as maybe_file_cover_image_public_bucket_hash,
    media_file_cover_image.maybe_public_bucket_prefix as maybe_file_cover_image_public_bucket_prefix,
    media_file_cover_image.maybe_public_bucket_extension as maybe_file_cover_image_public_bucket_extension,

    m.creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

    m.maybe_title,

    m.created_at,
    m.updated_at

FROM media_files AS m FORCE INDEX (fk_maybe_creator_user_token)
LEFT OUTER JOIN users
    ON m.maybe_creator_user_token = users.token
LEFT OUTER JOIN media_files as media_file_cover_image
    ON media_file_cover_image.token = m.maybe_cover_image_media_file_token
WHERE
    m.maybe_creator_user_token = ?
    AND m.media_class = ?
    AND m.user_deleted_at IS NULL
    AND m.mod_deleted_at IS NULL
    AND NOT m.is_intermediate_system_file
    AND m.id < ?
ORDER BY m.id DESC
LIMIT ?
      "#,
      user_token,
      media_class.to_str(),
      cursor_id,
      limit,
    )
      .fetch_all(mysql_executor)
      .await
}
