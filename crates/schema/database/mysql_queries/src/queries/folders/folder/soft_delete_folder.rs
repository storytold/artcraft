use sqlx::MySqlPool;

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

/// Mark a folder as deleted by stamping `maybe_deleted_at`. Children
/// retain their `maybe_parent_folder_token` and become "orphaned" — that
/// state is surfaced by the list query's `is_orphaned` flag.
pub async fn soft_delete_folder(
  folder_token: &FolderToken,
  owner_user_token: &UserToken,
  pool: &MySqlPool,
) -> Result<u64, sqlx::Error> {
  let result = sqlx::query!(
    r#"
UPDATE folders
SET maybe_deleted_at = NOW()
WHERE token = ?
  AND owner_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    folder_token.as_str(),
    owner_user_token.as_str(),
  )
    .execute(pool)
    .await?;
  Ok(result.rows_affected())
}
