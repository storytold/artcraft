use sqlx::MySqlPool;

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::queries::folders::folder::folder_row::FolderRow;

/// Fetch a single (live) folder by token, scoped to an owner. Returns
/// `Ok(None)` if the folder doesn't exist, is soft-deleted, or is owned
/// by a different user (don't leak existence of others' folders).
pub async fn get_folder_for_owner(
  folder_token: &FolderToken,
  owner_user_token: &UserToken,
  pool: &MySqlPool,
) -> Result<Option<FolderRow>, sqlx::Error> {
  let result = sqlx::query!(
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
WHERE f.token = ?
  AND f.owner_user_token = ?
  AND f.maybe_deleted_at IS NULL
LIMIT 1
    "#,
    folder_token.as_str(),
    owner_user_token.as_str(),
  )
    .fetch_optional(pool)
    .await?;

  Ok(result.map(|r| FolderRow {
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
  }))
}
