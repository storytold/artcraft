//! Resolve character tokens to Kinovi character IDs for prompting.

use log::warn;
use sqlx::MySql;

use mysql_queries::queries::characters::batch_lookup_characters_by_token_for_prompting::batch_lookup_characters_by_token_for_prompting;
use tokens::tokens::characters::CharacterToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Resolve character tokens to Kinovi character IDs for prompting.
///
/// Looks up the characters, filters to active ones with kinovi IDs, and warns about
/// any that are missing or inactive (but doesn't fail the request).
pub async fn resolve_kinovi_character_ids(
  maybe_tokens: Option<&[CharacterToken]>,
  connection: &mut sqlx::pool::PoolConnection<MySql>,
) -> Result<Option<Vec<String>>, AdvancedCommonWebError> {
  let tokens = match maybe_tokens {
    None => return Ok(None),
    Some(tokens) if tokens.is_empty() => return Ok(None),
    Some(tokens) => tokens,
  };

  let characters = batch_lookup_characters_by_token_for_prompting(tokens, connection)
      .await?;

  if characters.len() != tokens.len() {
    warn!(
      "Not all character tokens were found: requested {}, found {}",
      tokens.len(), characters.len(),
    );
  }

  for character in &characters {
    if !character.is_active {
      warn!("Character {} is not yet active, skipping", character.token);
    }
  }

  let ids: Vec<String> = characters.iter()
      .filter(|c| c.is_active)
      .filter_map(|c| c.kinovi_character_id.clone())
      .collect();

  if ids.is_empty() { Ok(None) } else { Ok(Some(ids)) }
}
