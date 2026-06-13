use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use mysql_queries::queries::beta_keys::edit_beta_key_note::edit_beta_key_note;
use tokens::tokens::beta_keys::BetaKeyToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct EditBetaKeyNotePathInfo {
  token: BetaKeyToken,
}

#[derive(Deserialize, ToSchema)]
pub struct EditBetaKeyNoteRequest {
  /// The note.
  /// If null or empty string, the note will be cleared.
  note: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct EditBetaKeyNoteSuccessResponse {
  pub success: bool,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
/// Edit or clear a note on a beta key
#[utoipa::path(
  post,
  tag = "Beta Keys",
  path = "/v1/beta_keys/{token}/note",
  responses(
    (status = 200, description = "Success", body = EditBetaKeyNoteSuccessResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = EditBetaKeyNoteRequest, description = "Payload for Request"),
    ("path" = EditBetaKeyNotePathInfo, description = "Path for Request")
  )
)]
pub async fn edit_beta_key_note_handler(
  http_request: HttpRequest,
  request: web::Json<EditBetaKeyNoteRequest>,
  path: Path<EditBetaKeyNotePathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, CommonWebError>
{
  let user_session = require_moderator(&http_request, &server_state.session_checker, &server_state.mysql_pool).await?;

  let maybe_note = request.note.as_deref()
      .map(|note| note.trim())
      .filter(|note| !note.is_empty())
      .map(|note| note.to_string());

  edit_beta_key_note(&path.token, maybe_note.as_deref(), &server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("Error editing beta key note: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let response = EditBetaKeyNoteSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
