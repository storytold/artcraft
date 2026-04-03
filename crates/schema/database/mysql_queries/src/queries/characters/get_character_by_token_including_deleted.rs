use sqlx::pool::PoolConnection;
use sqlx::{FromRow, MySql};

use tokens::tokens::characters::CharacterToken;
use tokens::tokens::users::UserToken;

/// Minimal character record for ownership and deletion checks.
#[derive(Debug, FromRow)]
pub struct CharacterOwnershipRecord {
  pub token: CharacterToken,
  pub maybe_creator_user_token: Option<UserToken>,
  pub is_active: bool,
  pub is_deleted: bool,
}

/// Look up a character by token, including soft-deleted records.
///
/// Returns `None` if the character does not exist at all.
pub async fn get_character_by_token_including_deleted(
  character_token: &CharacterToken,
  connection: &mut PoolConnection<MySql>,
) -> Result<Option<CharacterOwnershipRecord>, sqlx::Error> {
  let result = sqlx::query_as::<_, CharacterOwnershipRecord>(
    r#"
SELECT
  token,
  maybe_creator_user_token,
  is_active,
  (deleted_at IS NOT NULL) as is_deleted
FROM characters
WHERE token = ?
    "#,
  )
      .bind(character_token.as_str())
      .fetch_optional(&mut **connection)
      .await?;

  Ok(result)
}
