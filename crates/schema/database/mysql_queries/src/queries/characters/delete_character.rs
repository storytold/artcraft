use sqlx::pool::PoolConnection;
use sqlx::MySql;

use tokens::tokens::characters::CharacterToken;

/// Soft-delete a character by setting deleted_at to NOW().
///
/// This is idempotent — calling it on an already-deleted character is a no-op.
pub async fn delete_character(
  character_token: &CharacterToken,
  connection: &mut PoolConnection<MySql>,
) -> Result<(), sqlx::Error> {
  sqlx::query(
    r#"
UPDATE characters
SET deleted_at = NOW()
WHERE token = ?
  AND deleted_at IS NULL
LIMIT 1
    "#,
  )
      .bind(character_token.as_str())
      .execute(&mut **connection)
      .await?;

  Ok(())
}
