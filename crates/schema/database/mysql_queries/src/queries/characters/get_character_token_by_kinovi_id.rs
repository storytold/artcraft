use sqlx::MySqlPool;

use tokens::tokens::characters::CharacterToken;

/// Look up a character token by its Kinovi character ID.
pub async fn get_character_token_by_kinovi_id(
  kinovi_character_id: &str,
  pool: &MySqlPool,
) -> Result<Option<CharacterToken>, sqlx::Error> {
  let row = sqlx::query_as::<_, (CharacterToken,)>(
    r#"
SELECT token
FROM characters
WHERE kinovi_character_id = ?
  AND deleted_at IS NULL
LIMIT 1
    "#,
  )
      .bind(kinovi_character_id)
      .fetch_optional(pool)
      .await?;

  Ok(row.map(|(token,)| token))
}
