use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};

use artcraft_api_defs::characters::edit_character::{EditCharacterRequest, EditCharacterResponse};
use mysql_queries::queries::characters::get_character_by_token::get_character_by_token;
use mysql_queries::queries::characters::update_character_name_and_description::update_character_name_and_description;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::update_character::update_character::{update_character, UpdateCharacterArgs};

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

/// Edit a character's name or description.
#[utoipa::path(
  post,
  tag = "Characters",
  path = "/v1/character/edit",
  request_body = EditCharacterRequest,
  responses(
    (status = 200, description = "Success", body = EditCharacterResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 404, description = "Not found"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn edit_character_handler(
  http_request: HttpRequest,
  request: Json<EditCharacterRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<EditCharacterResponse>, AdvancedCommonWebError> {

  // --- Auth ---

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let user_session = require_user_session_using_connection(
    &http_request,
    &server_state.session_checker,
    &mut mysql_connection,
  ).await?;

  let user_token = &user_session.user_token;
  let is_mod = user_session.is_mod();

  // --- Look up character ---

  let character = get_character_by_token(&request.token, &mut mysql_connection)
      .await?
      .ok_or_else(|| {
        warn!("Character not found: {}", request.token);
        AdvancedCommonWebError::NotFound
      })?;

  // --- Ownership check ---

  let is_owner = character.maybe_creator_user_token
      .as_ref()
      .map(|owner| owner == user_token)
      .unwrap_or(false);

  if !is_owner && !is_mod {
    warn!("User {} tried to edit character {} they don't own", user_token, request.token);
    return Err(AdvancedCommonWebError::NotFound);
  }

  // --- Determine what to update ---

  let new_name = resolve_name_update(&request.updated_name);
  let description_update = resolve_description_update(&request.updated_description);

  let has_name_change = new_name.is_some();
  let has_description_change = !matches!(description_update, DescriptionUpdateType::NoUpdate);

  if !has_name_change && !has_description_change {
    return Ok(Json(EditCharacterResponse { success: true }));
  }

  // --- Compute final values ---

  let final_name = new_name.unwrap_or_else(|| character.character_name.clone().unwrap_or_default());

  let final_kinovi_name = if has_name_change { final_name.clone() } else {
    character.kinovi_character_name.clone()
        .or_else(|| character.character_name.clone())
        .unwrap_or_default()
  };

  let final_description = match &description_update {
    DescriptionUpdateType::NoUpdate => character.maybe_description.clone(),
    DescriptionUpdateType::Nullify => None,
    DescriptionUpdateType::Update(text) => Some(text.clone()),
  };

  // --- If renaming, update Kinovi first ---

  if has_name_change {
    if let Some(ref kinovi_id) = character.kinovi_character_id {
      let session = Seedance2ProSession::from_cookies_string(
        server_state.seedance2pro.cookies.clone()
      );

      update_character(UpdateCharacterArgs {
        session: &session,
        character_id: kinovi_id.clone(),
        name: final_name.clone(),
        description: final_description.clone().unwrap_or_default(),
        host_override: None,
      })
          .await
          .map_err(|err| {
            error!("Error updating character on Kinovi: {:?}", err);
            AdvancedCommonWebError::from_error(err)
          })?;

      info!("Updated character {} on Kinovi (name='{}')", kinovi_id, final_name);
    }
  }

  // --- Update database ---

  update_character_name_and_description(
    &request.token,
    &final_name,
    &final_kinovi_name,
    final_description.as_deref(),
    &mut mysql_connection,
  ).await?;

  info!("Updated character {} in database", request.token);

  Ok(Json(EditCharacterResponse { success: true }))
}

// =============== Private helpers ===============

const MAX_NAME_LENGTH: usize = 50;
const MAX_DESCRIPTION_LENGTH: usize = 500;

enum DescriptionUpdateType {
  NoUpdate,
  Nullify,
  Update(String),
}

/// Determine the new name, if any.
/// Returns None if the name should not be updated.
fn resolve_name_update(updated_name: &Option<String>) -> Option<String> {
  let name = updated_name.as_ref()?;
  let trimmed = name.trim();
  if trimmed.is_empty() {
    None
  } else {
    Some(truncate(trimmed, MAX_NAME_LENGTH))
  }
}

/// Determine the description update type.
fn resolve_description_update(updated_description: &Option<String>) -> DescriptionUpdateType {
  let desc = match updated_description.as_ref() {
    None => return DescriptionUpdateType::NoUpdate,
    Some(d) => d,
  };

  let trimmed = desc.trim();
  if trimmed.is_empty() {
    DescriptionUpdateType::Nullify
  } else {
    DescriptionUpdateType::Update(truncate(trimmed, MAX_DESCRIPTION_LENGTH))
  }
}

fn truncate(s: &str, max_len: usize) -> String {
  if s.len() <= max_len { s.to_string() } else { s[..max_len].to_string() }
}
