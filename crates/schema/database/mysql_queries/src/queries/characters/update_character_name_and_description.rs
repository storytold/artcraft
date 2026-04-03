use sqlx::pool::PoolConnection;
use sqlx::MySql;

use tokens::tokens::characters::CharacterToken;

/// Update a character's name, kinovi name, and/or description.
///
/// All fields are always SET in the query — the caller should pass the
/// existing values for fields that should not change.
pub async fn update_character_name_and_description(
  character_token: &CharacterToken,
  character_name: &str,
  kinovi_character_name: &str,
  maybe_description: Option<&str>,
  connection: &mut PoolConnection<MySql>,
) -> Result<(), sqlx::Error> {
  sqlx::query!(
    r#"
UPDATE characters
SET
  character_name = ?,
  kinovi_character_name = ?,
  maybe_description = ?
WHERE token = ?
  AND deleted_at IS NULL
    "#,
    character_name,
    kinovi_character_name,
    maybe_description,
    character_token.as_str(),
  )
      .execute(&mut **connection)
      .await?;

  Ok(())
}
