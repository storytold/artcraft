use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use mysql_queries::queries::beta_keys::edit_beta_key_distributed_flag::edit_beta_key_distributed_flag;
use tokens::tokens::beta_keys::BetaKeyToken;
use tokens::tokens::w2l_results::W2lResultToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, RequireModeratorError, UseDatabase};
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct EditBetaKeyDistributedFlagPathInfo {
  token: BetaKeyToken,
}

#[derive(Deserialize, ToSchema)]
pub struct EditBetaKeyDistributedFlagRequest {
  /// Whether to mark the flag as "distributed", i.e. we gave the key to someone.
  /// This will help us not to give out the same key twice.
  is_distributed: bool,
}

#[derive(Serialize, ToSchema)]
pub struct EditBetaKeyDistributedFlagSuccessResponse {
  pub success: bool,
}

#[derive(Debug, ToSchema)]
pub enum EditBetaKeyDistributedFlagError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for EditBetaKeyDistributedFlagError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EditBetaKeyDistributedFlagError::BadInput(_) => StatusCode::BAD_REQUEST,
      EditBetaKeyDistributedFlagError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EditBetaKeyDistributedFlagError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EditBetaKeyDistributedFlagError::BadInput(reason) => reason.to_string(),
      EditBetaKeyDistributedFlagError::NotAuthorized => "unauthorized".to_string(),
      EditBetaKeyDistributedFlagError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EditBetaKeyDistributedFlagError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Edit the "distributed" flag on a beta key to mark it as shared
#[utoipa::path(
  post,
  tag = "Beta Keys",
  path = "/v1/beta_keys/{token}/distributed",
  responses(
    (status = 200, description = "Success", body = EditBetaKeyDistributedFlagSuccessResponse),
    (status = 400, description = "Bad input", body = EditBetaKeyDistributedFlagError),
    (status = 401, description = "Not authorized", body = EditBetaKeyDistributedFlagError),
    (status = 500, description = "Server error", body = EditBetaKeyDistributedFlagError),
  ),
  params(
    ("request" = EditBetaKeyDistributedFlagRequest, description = "Payload for Request"),
    ("path" = EditBetaKeyDistributedFlagPathInfo, description = "Path for Request")
  )
)]
pub async fn edit_beta_key_distributed_flag_handler(
  http_request: HttpRequest,
  request: web::Json<EditBetaKeyDistributedFlagRequest>,
  path: Path<EditBetaKeyDistributedFlagPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, EditBetaKeyDistributedFlagError>
{
  let user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
      .await
      .map_err(|err| match err {
        RequireModeratorError::ServerError => EditBetaKeyDistributedFlagError::ServerError,
        RequireModeratorError::NotAuthorized => EditBetaKeyDistributedFlagError::NotAuthorized,
      })?;

  edit_beta_key_distributed_flag(&path.token, request.is_distributed, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("Error editing beta key note: {:?}", err);
        EditBetaKeyDistributedFlagError::ServerError
      })?;

  let response = EditBetaKeyDistributedFlagSuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| EditBetaKeyDistributedFlagError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
