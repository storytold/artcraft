use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::{info, warn};

use artcraft_api_defs::characters::delete_character::{DeleteCharacterPathInfo, DeleteCharacterResponse};
use tokens::tokens::characters::CharacterToken;
use mysql_queries::queries::characters::delete_character::delete_character;
use mysql_queries::queries::characters::get_character_by_token_including_deleted::get_character_by_token_including_deleted;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

/// Delete a character.
#[utoipa::path(
  delete,
  tag = "Characters",
  path = "/v1/character/{character_token}",
  responses(
    (status = 200, description = "Success", body = DeleteCharacterResponse),
    (status = 401, description = "Unauthorized"),
    (status = 404, description = "Not found"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("character_token" = CharacterToken, Path, description = "Character token"),
  )
)]
pub async fn delete_character_handler(
  http_request: HttpRequest,
  path: Path<DeleteCharacterPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<DeleteCharacterResponse>, AdvancedCommonWebError> {

  let character_token = &path.character_token;

  // --- Auth ---

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let user_session = require_user_session_using_connection(
    &http_request,
    &server_state.session_checker,
    &mut mysql_connection,
  ).await?;

  let user_token = &user_session.user_token;
  let is_mod = user_session.is_mod();

  // --- Look up the character (including deleted) ---

  let character = get_character_by_token_including_deleted(character_token, &mut mysql_connection)
      .await?
      .ok_or_else(|| {
        warn!("Character not found: {}", character_token);
        AdvancedCommonWebError::NotFound
      })?;

  // Already deleted — return success idempotently.
  if character.is_deleted {
    info!("Character {} is already deleted", character_token);
    return Ok(Json(DeleteCharacterResponse { success: true }));
  }

  // --- Ownership check ---

  let is_owner = character.maybe_creator_user_token
      .as_ref()
      .map(|owner| owner == user_token)
      .unwrap_or(false);

  if !is_owner && !is_mod {
    warn!(
      "User {} attempted to delete character {} owned by {:?}",
      user_token, character_token, character.maybe_creator_user_token,
    );
    return Err(AdvancedCommonWebError::NotAuthorized);
  }

  // --- Soft delete ---

  delete_character(character_token, &mut mysql_connection).await?;

  info!("Character {} deleted by user {}", character_token, user_token);

  Ok(Json(DeleteCharacterResponse { success: true }))
}
