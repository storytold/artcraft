use sqlx::MySqlPool;

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

/// Rename a folder. Scoped to owner so callers can't rename a folder they
/// don't own. Returns the number of rows updated (0 if no live folder
/// matched).
pub async fn update_folder_name(
  folder_token: &FolderToken,
  owner_user_token: &UserToken,
  new_name: &str,
  pool: &MySqlPool,
) -> Result<u64, sqlx::Error> {
  let result = sqlx::query!(
    r#"
UPDATE folders
SET name = ?
WHERE token = ?
  AND owner_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    new_name,
    folder_token.as_str(),
    owner_user_token.as_str(),
  )
    .execute(pool)
    .await?;
  Ok(result.rows_affected())
}
