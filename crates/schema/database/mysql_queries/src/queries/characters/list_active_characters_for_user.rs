use sqlx::pool::PoolConnection;
use sqlx::MySql;

use enums::by_table::characters::character_type::CharacterType;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

const DEFAULT_PAGE_SIZE: u32 = 50;

/// A character row for the list endpoint.
pub struct CharacterListRow {
  pub id: u64,
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

pub struct ListActiveCharactersResult {
  pub characters: Vec<CharacterListRow>,
  pub next_cursor: Option<u64>,
}

/// List active, non-deleted characters for a user, paginated by descending id.
pub async fn list_active_characters_for_user(
  user_token: &UserToken,
  maybe_cursor: Option<u64>,
  connection: &mut PoolConnection<MySql>,
) -> Result<ListActiveCharactersResult, sqlx::Error> {
  let fetch_limit = (DEFAULT_PAGE_SIZE + 1) as i64;
  let id_cursor = maybe_cursor.map(|c| c as i64).unwrap_or(i64::MAX);

  let rows = sqlx::query_as!(
    CharacterListRow,
    r#"
SELECT
  id as `id: u64`,
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
WHERE maybe_creator_user_token = ?
  AND is_active = true
  AND deleted_at IS NULL
  AND id < ?
ORDER BY id DESC
LIMIT ?
    "#,
    user_token.as_str(),
    id_cursor,
    fetch_limit,
  )
      .fetch_all(&mut **connection)
      .await?;

  let has_next = rows.len() as u32 >= DEFAULT_PAGE_SIZE;
  let characters: Vec<CharacterListRow> = rows.into_iter().take(DEFAULT_PAGE_SIZE as usize).collect();
  let next_cursor = if has_next {
    characters.last().map(|c| c.id)
  } else {
    None
  };

  Ok(ListActiveCharactersResult {
    characters,
    next_cursor,
  })
}
