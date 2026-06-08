use sqlx::MySqlPool;

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

pub async fn update_folder_has_star(
  folder_token: &FolderToken,
  owner_user_token: &UserToken,
  has_star: bool,
  pool: &MySqlPool,
) -> Result<u64, sqlx::Error> {
  let result = sqlx::query!(
    r#"
UPDATE folders
SET has_star = ?
WHERE token = ?
  AND owner_user_token = ?
  AND maybe_deleted_at IS NULL
LIMIT 1
    "#,
    has_star,
    folder_token.as_str(),
    owner_user_token.as_str(),
  )
    .execute(pool)
    .await?;
  Ok(result.rows_affected())
}
