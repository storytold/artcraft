use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};

use artcraft_api_defs::characters::list_characters::{ListCharactersQuery, ListCharactersResponse};
use artcraft_api_defs::characters::shared::CharacterDetails;
use enums::common::generation::common_model_type::CommonModelType;
use tokens::tokens::characters::CharacterToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// List characters for the current session.
#[utoipa::path(
  get,
  tag = "Characters",
  path = "/v1/characters/session",
  params(ListCharactersQuery),
  responses(
    (status = 200, description = "Success", body = ListCharactersResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn list_characters_handler(
  _http_request: HttpRequest,
  _query: Query<ListCharactersQuery>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListCharactersResponse>, CommonWebError> {
  // TODO: Replace with real implementation.
  let mock_characters = vec![
    CharacterDetails {
      token: CharacterToken::new_from_str("character_mock_abc123"),
      models: vec![CommonModelType::Seedance2p0],
      name: "Juno".to_string(),
      maybe_description: Some("Juno the shiba inu".to_string()),
      maybe_avatar: None,
      maybe_full_image: None,
    },
    CharacterDetails {
      token: CharacterToken::new_from_str("character_mock_def456"),
      models: vec![CommonModelType::Seedance2p0],
      name: "Ernest".to_string(),
      maybe_description: Some("Ernest P. Worrell".to_string()),
      maybe_avatar: None,
      maybe_full_image: None,
    },
  ];

  Ok(Json(ListCharactersResponse {
    success: true,
    characters: mock_characters,
    next_cursor: None,
  }))
}
