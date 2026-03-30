use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};

use artcraft_api_defs::characters::delete_character::{DeleteCharacterPathInfo, DeleteCharacterResponse};
use tokens::tokens::characters::CharacterToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
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
  _http_request: HttpRequest,
  _path: Path<DeleteCharacterPathInfo>,
  _server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<DeleteCharacterResponse>, CommonWebError> {
  todo!()
}
