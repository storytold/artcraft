use sqlx::MySqlPool;

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::queries::folders::folder::folder_row::FolderRow;

pub struct ListSubfoldersArgs<'a> {
  pub parent_folder_token: &'a FolderToken,
  pub owner_user_token: &'a UserToken,
  pub maybe_cursor_id: Option<u64>,
  pub limit: u32,
  pub pool: &'a MySqlPool,
}

/// Paginated list of live folders whose `maybe_parent_folder_token` is
/// the given parent. Scoped to the owner to avoid leaking siblings of
/// folders owned by another user.
///
/// The `is_orphaned` flag will be `false` for all results: by definition,
/// the parent matched here so it exists. (A leftover, soft-deleted parent
/// is still treated as "parent exists" — that case is rare and not the
/// caller's concern for this endpoint.)
pub async fn list_subfolders(
  args: ListSubfoldersArgs<'_>,
) -> Result<Vec<FolderRow>, sqlx::Error> {
  let limit = args.limit as i64;

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
  f.updated_at
FROM folders f
WHERE f.maybe_parent_folder_token = ?
  AND f.owner_user_token = ?
  AND f.maybe_deleted_at IS NULL
  AND f.id < ?
ORDER BY f.id DESC
LIMIT ?
        "#,
        args.parent_folder_token.as_str(),
        args.owner_user_token.as_str(),
        cursor_id,
        limit,
      )
        .fetch_all(args.pool)
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
          is_orphaned: false,
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
  f.updated_at
FROM folders f
WHERE f.maybe_parent_folder_token = ?
  AND f.owner_user_token = ?
  AND f.maybe_deleted_at IS NULL
ORDER BY f.id DESC
LIMIT ?
        "#,
        args.parent_folder_token.as_str(),
        args.owner_user_token.as_str(),
        limit,
      )
        .fetch_all(args.pool)
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
          is_orphaned: false,
        })
        .collect::<Vec<_>>()
    }
  };

  Ok(rows)
}
