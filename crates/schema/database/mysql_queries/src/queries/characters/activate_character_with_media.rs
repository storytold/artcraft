use sqlx::MySqlPool;

use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;

/// Activate a character after its creation job completes successfully.
///
/// Sets `is_active = true`, attaches media tokens, and records the kinovi asset ID.
pub async fn activate_character_with_media(
  character_token: &CharacterToken,
  maybe_avatar_media_token: Option<&MediaFileToken>,
  maybe_full_image_media_token: Option<&MediaFileToken>,
  maybe_kinovi_asset_id: Option<&str>,
  pool: &MySqlPool,
) -> Result<(), sqlx::Error> {
  sqlx::query!(
    r#"
UPDATE characters
SET
  is_active = true,
  maybe_avatar_media_token = ?,
  maybe_full_image_media_token = ?,
  maybe_kinovi_asset_id = ?
WHERE token = ?
  AND deleted_at IS NULL
LIMIT 1
    "#,
    maybe_avatar_media_token.map(|t| t.as_str()),
    maybe_full_image_media_token.map(|t| t.as_str()),
    maybe_kinovi_asset_id,
    character_token.as_str(),
  )
      .execute(pool)
      .await?;

  Ok(())
}
