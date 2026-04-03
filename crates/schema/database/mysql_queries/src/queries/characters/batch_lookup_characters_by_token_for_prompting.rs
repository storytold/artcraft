use errors::AnyhowResult;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, QueryBuilder, Row};
use sqlx::mysql::MySqlRow;

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
/// Characters that are not found (or soft-deleted) are silently omitted from the results.
pub async fn batch_lookup_characters_by_token_for_prompting(
  tokens: &[CharacterToken],
  connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<CharacterPromptData>> {
  if tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    r#"
SELECT
  token,
  is_active,
  character_name,
  kinovi_character_id,
  kinovi_character_name
FROM characters
WHERE deleted_at IS NULL
  AND token IN (
    "#,
  );

  // NB: SQLx does not support WHERE IN(?) for Vec<T>.
  // Issue: https://github.com/launchbadge/sqlx/issues/875
  // We follow the same pattern as batch_get_media_files_by_tokens.
  query_builder.push(token_predicate(tokens));
  query_builder.push(")");

  let rows: Vec<MySqlRow> = query_builder
      .build()
      .fetch_all(&mut **connection)
      .await?;

  let results = rows.iter().map(|row| {
    CharacterPromptData {
      character_token: CharacterToken::new(row.get("token")),
      is_active: row.get("is_active"),
      character_name: row.get("character_name"),
      kinovi_character_id: row.get("kinovi_character_id"),
      kinovi_character_name: row.get("kinovi_character_name"),
    }
  }).collect();

  Ok(results)
}

// =============== Private helpers ===============

/// Build a comma-separated predicate for the IN clause.
fn token_predicate(tokens: &[CharacterToken]) -> String {
  tokens.iter()
      .map(|t| t.as_str())
      .map(|t| format!("\"{}\"", t))
      .collect::<Vec<String>>()
      .join(", ")
}
