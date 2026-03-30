use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};

use artcraft_api_defs::characters::get_character::{GetCharacterDetails, GetCharacterPathInfo, GetCharacterResponse};
use enums::common::generation::common_model_type::CommonModelType;
use tokens::tokens::characters::CharacterToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// Get a character by token.
#[utoipa::path(
  get,
  tag = "Characters",
  path = "/v1/character/{character_token}",
  responses(
    (status = 200, description = "Success", body = GetCharacterResponse),
    (status = 404, description = "Not found"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("character_token" = CharacterToken, Path, description = "Character token"),
  )
)]
pub async fn get_character_handler(
  _http_request: HttpRequest,
  path: Path<GetCharacterPathInfo>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<GetCharacterResponse>, CommonWebError> {
  // TODO: Replace with real implementation.
  let mock_character = GetCharacterDetails {
    token: path.character_token.clone(),
    models: vec![CommonModelType::Seedance2p0],
    name: "Mock Character".to_string(),
    maybe_description: Some("This is a mock character for development.".to_string()),
    maybe_avatar: None,
    maybe_full_image: None,
  };

  Ok(Json(GetCharacterResponse {
    success: true,
    character: mock_character,
  }))
}
