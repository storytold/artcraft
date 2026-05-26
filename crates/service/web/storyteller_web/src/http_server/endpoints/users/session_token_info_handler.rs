use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use http_server_common::response::response_error_helpers::to_simple_json_error;

use crate::http_server::session::session_checker::SessionChecker;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct SessionTokenInfoSuccessResponse {
  /// A signed session that can be sent as a header, bypassing cookies.
  /// This is useful for API clients that don't support cookies or Google
  /// browsers killing cross-domain cookies.
  /// Send this as the "Session:" header.
  pub maybe_signed_session: Option<String>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
/// Hack to bypass CORS. !!!!!!!!!!!DO NOT USE THIS!!!!!!!!!!!!!!
///
/// Seriously do not use this unless you okay it with Brandon, Kasisnu, or Michael.
/// This is poison and is a huge security vuln.
#[utoipa::path(
  get,
  tag = "Users",
  path = "/v1/session_token",
  responses(
    (status = 200, description = "Success response", body = SessionTokenInfoSuccessResponse),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
)]
pub async fn session_token_info_handler(
  http_request: HttpRequest,
  session_checker: web::Data<SessionChecker>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<SessionTokenInfoSuccessResponse>, CommonWebError>
{
  let maybe_session_payload = server_state
      .session_cookie_manager
      .check_and_return_session_token_decodes(&http_request)
      .map_err(|e| {
        warn!("Session cookie decode error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  Ok(Json(SessionTokenInfoSuccessResponse {
    maybe_signed_session: maybe_session_payload,
  }))
}
