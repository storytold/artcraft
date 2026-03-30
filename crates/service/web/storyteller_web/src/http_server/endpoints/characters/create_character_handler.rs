use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};

use artcraft_api_defs::characters::create_character::{CreateCharacterRequest, CreateCharacterResponse};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// Create a new character.
#[utoipa::path(
  post,
  tag = "Characters",
  path = "/v1/character/create",
  request_body = CreateCharacterRequest,
  responses(
    (status = 200, description = "Success", body = CreateCharacterResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 402, description = "Payment required"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn create_character_handler(
  _http_request: HttpRequest,
  _request: Json<CreateCharacterRequest>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<CreateCharacterResponse>, CommonWebError> {
  todo!()
}
