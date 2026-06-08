use sqlx::MySqlPool;

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

/// Set or clear (`None`) the color code on a folder.
pub async fn update_folder_color_code(
  folder_token: &FolderToken,
  owner_user_token: &UserToken,
  maybe_color_code: Option<&str>,
  pool: &MySqlPool,
) -> Result<u64, sqlx::Error> {
  let result = sqlx::query!(
    r#"
UPDATE folders
SET maybe_color_code = ?
WHERE token = ?
  AND owner_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    maybe_color_code,
    folder_token.as_str(),
    owner_user_token.as_str(),
  )
    .execute(pool)
    .await?;
  Ok(result.rows_affected())
}
