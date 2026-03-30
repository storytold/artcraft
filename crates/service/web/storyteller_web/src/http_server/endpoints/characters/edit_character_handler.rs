use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};

use artcraft_api_defs::characters::edit_character::{EditCharacterRequest, EditCharacterResponse};

use crate::http_server::common_responses::common_web_error::CommonWebError;
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
  _http_request: HttpRequest,
  _request: Json<EditCharacterRequest>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<EditCharacterResponse>, CommonWebError> {
  todo!()
}
