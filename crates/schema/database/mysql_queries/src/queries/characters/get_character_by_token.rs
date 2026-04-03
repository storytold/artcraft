use sqlx::pool::PoolConnection;
use sqlx::MySql;

use enums::by_table::characters::character_type::CharacterType;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

/// Full character record for the GET endpoint.
pub struct CharacterRecord {
  pub token: CharacterToken,
  pub character_type: CharacterType,
  pub is_active: bool,
  pub character_name: Option<String>,
  pub maybe_description: Option<String>,
  pub maybe_avatar_media_token: Option<MediaFileToken>,
  pub maybe_full_image_media_token: Option<MediaFileToken>,
  pub maybe_original_upload_media_token: Option<MediaFileToken>,
  pub maybe_creator_user_token: Option<UserToken>,
  pub kinovi_character_id: Option<String>,
  pub kinovi_character_name: Option<String>,
  pub maybe_kinovi_asset_id: Option<String>,
}

/// Look up a character by token (excluding soft-deleted).
pub async fn get_character_by_token(
  character_token: &CharacterToken,
  connection: &mut PoolConnection<MySql>,
) -> Result<Option<CharacterRecord>, sqlx::Error> {
  sqlx::query_as!(
    CharacterRecord,
    r#"
SELECT
  token as `token: tokens::tokens::characters::CharacterToken`,
  character_type as `character_type: enums::by_table::characters::character_type::CharacterType`,
  is_active as `is_active: bool`,
  character_name,
  maybe_description,
  maybe_avatar_media_token as `maybe_avatar_media_token: tokens::tokens::media_files::MediaFileToken`,
  maybe_full_image_media_token as `maybe_full_image_media_token: tokens::tokens::media_files::MediaFileToken`,
  maybe_original_upload_media_token as `maybe_original_upload_media_token: tokens::tokens::media_files::MediaFileToken`,
  maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
  kinovi_character_id,
  kinovi_character_name,
  maybe_kinovi_asset_id
FROM characters
WHERE token = ?
  AND deleted_at IS NULL
    "#,
    character_token.as_str(),
  )
      .fetch_optional(&mut **connection)
      .await
}
