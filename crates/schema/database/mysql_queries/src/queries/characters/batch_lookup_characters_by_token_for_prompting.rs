use sqlx::pool::PoolConnection;
use sqlx::{FromRow, MySql, QueryBuilder};

use tokens::tokens::characters::CharacterToken;

/// Character data needed for constructing prompts with character references.
#[derive(Debug, FromRow)]
pub struct CharacterPromptData {
  pub token: CharacterToken,
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
) -> Result<Vec<CharacterPromptData>, sqlx::Error> {
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

  let mut separated = query_builder.separated(", ");
  for token in tokens {
    separated.push_bind(token.as_str().to_string());
  }

  query_builder.push(")");

  let results: Vec<CharacterPromptData> = query_builder
      .build_query_as::<CharacterPromptData>()
      .fetch_all(&mut **connection)
      .await?;

  Ok(results)
}
