use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::queries::folders::folder::folder_row::FolderRow;

pub struct ListFoldersForUserArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub owner_user_token: &'e UserToken,
  pub maybe_cursor_id: Option<u64>,
  pub limit: u32,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// List all live folders owned by a user, newest first. Includes the
/// derived `is_orphaned` flag computed by joining the table against itself
/// on `maybe_parent_folder_token` — orphaned means the parent row is
/// missing or soft-deleted.
pub async fn list_folders_for_user<'e, 'c: 'e, E>(
  args: ListFoldersForUserArgs<'e, 'c, E>,
) -> Result<Vec<FolderRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let limit = args.limit as i64;

  // Two query branches because sqlx::query! can't accept a conditional
  // WHERE clause at the macro level. `args.mysql_executor` is moved into
  // exactly one arm at runtime — Rust permits this since the arms are
  // mutually exclusive.
  let rows = match args.maybe_cursor_id {
    Some(cursor_id) => {
      sqlx::query!(
        r#"
SELECT
  f.id as `id: u64`,
  f.token as `token: FolderToken`,
  f.name,
  f.owner_user_token as `owner_user_token: UserToken`,
  f.maybe_parent_folder_token as `maybe_parent_folder_token: FolderToken`,
  f.maybe_last_media_file_token_1 as `maybe_last_media_file_token_1: MediaFileToken`,
  f.maybe_last_media_file_token_2 as `maybe_last_media_file_token_2: MediaFileToken`,
  f.maybe_last_media_file_token_3 as `maybe_last_media_file_token_3: MediaFileToken`,
  f.maybe_last_media_file_token_4 as `maybe_last_media_file_token_4: MediaFileToken`,
  f.maybe_cover_image_custom_media_token as `maybe_cover_image_custom_media_token: MediaFileToken`,
  f.maybe_color_code,
  f.has_star as `has_star: bool`,
  f.created_at,
  f.updated_at,
  (
    f.maybe_parent_folder_token IS NOT NULL
    AND (p.token IS NULL OR p.maybe_deleted_at IS NOT NULL)
  ) as `is_orphaned: bool`
FROM folders f
LEFT JOIN folders p
  ON p.token = f.maybe_parent_folder_token
WHERE f.owner_user_token = ?
  AND f.maybe_deleted_at IS NULL
  AND f.id < ?
ORDER BY f.id DESC
LIMIT ?
        "#,
        args.owner_user_token.as_str(),
        cursor_id,
        limit,
      )
        .fetch_all(args.mysql_executor)
        .await?
        .into_iter()
        .map(|r| FolderRow {
          id: r.id,
          token: r.token,
          name: r.name,
          owner_user_token: r.owner_user_token,
          maybe_parent_folder_token: r.maybe_parent_folder_token,
          maybe_last_media_file_token_1: r.maybe_last_media_file_token_1,
          maybe_last_media_file_token_2: r.maybe_last_media_file_token_2,
          maybe_last_media_file_token_3: r.maybe_last_media_file_token_3,
          maybe_last_media_file_token_4: r.maybe_last_media_file_token_4,
          maybe_cover_image_custom_media_token: r.maybe_cover_image_custom_media_token,
          maybe_color_code: r.maybe_color_code,
          has_star: r.has_star,
          created_at: r.created_at,
          updated_at: r.updated_at,
          is_orphaned: r.is_orphaned,
        })
        .collect::<Vec<_>>()
    }
    None => {
      sqlx::query!(
        r#"
SELECT
  f.id as `id: u64`,
  f.token as `token: FolderToken`,
  f.name,
  f.owner_user_token as `owner_user_token: UserToken`,
  f.maybe_parent_folder_token as `maybe_parent_folder_token: FolderToken`,
  f.maybe_last_media_file_token_1 as `maybe_last_media_file_token_1: MediaFileToken`,
  f.maybe_last_media_file_token_2 as `maybe_last_media_file_token_2: MediaFileToken`,
  f.maybe_last_media_file_token_3 as `maybe_last_media_file_token_3: MediaFileToken`,
  f.maybe_last_media_file_token_4 as `maybe_last_media_file_token_4: MediaFileToken`,
  f.maybe_cover_image_custom_media_token as `maybe_cover_image_custom_media_token: MediaFileToken`,
  f.maybe_color_code,
  f.has_star as `has_star: bool`,
  f.created_at,
  f.updated_at,
  (
    f.maybe_parent_folder_token IS NOT NULL
    AND (p.token IS NULL OR p.maybe_deleted_at IS NOT NULL)
  ) as `is_orphaned: bool`
FROM folders f
LEFT JOIN folders p
  ON p.token = f.maybe_parent_folder_token
WHERE f.owner_user_token = ?
  AND f.maybe_deleted_at IS NULL
ORDER BY f.id DESC
LIMIT ?
        "#,
        args.owner_user_token.as_str(),
        limit,
      )
        .fetch_all(args.mysql_executor)
        .await?
        .into_iter()
        .map(|r| FolderRow {
          id: r.id,
          token: r.token,
          name: r.name,
          owner_user_token: r.owner_user_token,
          maybe_parent_folder_token: r.maybe_parent_folder_token,
          maybe_last_media_file_token_1: r.maybe_last_media_file_token_1,
          maybe_last_media_file_token_2: r.maybe_last_media_file_token_2,
          maybe_last_media_file_token_3: r.maybe_last_media_file_token_3,
          maybe_last_media_file_token_4: r.maybe_last_media_file_token_4,
          maybe_cover_image_custom_media_token: r.maybe_cover_image_custom_media_token,
          maybe_color_code: r.maybe_color_code,
          has_star: r.has_star,
          created_at: r.created_at,
          updated_at: r.updated_at,
          is_orphaned: r.is_orphaned,
        })
        .collect::<Vec<_>>()
    }
  };

  Ok(rows)
}
