use anyhow::anyhow;
use log::warn;
use sqlx::pool::PoolConnection;
use sqlx::MySql;

use tokens::tokens::characters::CharacterToken;

/// Character data needed for constructing prompts with character references.
#[derive(Debug)]
pub struct CharacterPromptData {
  pub character_token: CharacterToken,
  pub is_active: bool,
  pub character_name: Option<String>,
  pub kinovi_character_id: Option<String>,
  pub kinovi_character_name: Option<String>,
}

/// Look up multiple characters by their tokens, returning the data needed for prompting.
///
/// Characters that are not found are silently omitted from the results.
pub async fn batch_lookup_characters_by_token_for_prompting(
  tokens: &[CharacterToken],
  connection: &mut PoolConnection<MySql>,
) -> anyhow::Result<Vec<CharacterPromptData>> {
  if tokens.is_empty() {
    return Ok(Vec::new());
  }

  // SQLx doesn't support IN-clause with dynamic lists in query! macro,
  // so we build the query manually with placeholders.
  let placeholders: Vec<&str> = tokens.iter().map(|_| "?").collect();
  let in_clause = placeholders.join(", ");

  let sql = format!(
    r#"
SELECT
  token,
  is_active,
  character_name,
  kinovi_character_id,
  kinovi_character_name
FROM characters
WHERE token IN ({})
  AND deleted_at IS NULL
    "#,
    in_clause,
  );

  let mut query = sqlx::query_as::<_, RawRow>(&sql);

  for token in tokens {
    query = query.bind(token.as_str());
  }

  let rows = query
      .fetch_all(&mut **connection)
      .await
      .map_err(|err| anyhow!("Error looking up characters by token: {:?}", err))?;

  let results = rows.into_iter().map(|row| {
    CharacterPromptData {
      character_token: row.token,
      is_active: row.is_active,
      character_name: row.character_name,
      kinovi_character_id: row.kinovi_character_id,
      kinovi_character_name: row.kinovi_character_name,
    }
  }).collect();

  Ok(results)
}

// =============== Private helpers ===============

#[derive(sqlx::FromRow)]
struct RawRow {
  token: CharacterToken,
  is_active: bool,
  character_name: Option<String>,
  kinovi_character_id: Option<String>,
  kinovi_character_name: Option<String>,
}
