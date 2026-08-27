use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::mcp_sessions::revoke_mcp_session::RevokeMcpSessionSuccessResponse;
use mysql_queries::queries::mcp_sessions::revoke_mcp_session::{
  revoke_mcp_session, RevokeMcpSessionArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::get_authorization_header_mcp_private_session_token::get_authorization_header_mcp_private_session_token;
use crate::state::server_state::ServerState;

/// Terminate the calling MCP session (authenticated ONLY by its `private_session_token` in the
/// `Authorization` header), marking it invalid for all future use. Sessions are not
/// recoverable.
#[utoipa::path(
  post,
  tag = "MCP Sessions",
  path = "/v1/mcp/session/revoke",
  responses(
    (status = 200, body = RevokeMcpSessionSuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn revoke_mcp_session_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<RevokeMcpSessionSuccessResponse>, CommonWebError> {
  let private_session_token =
    get_authorization_header_mcp_private_session_token(&http_request)
      .ok_or_else(|| {
        warn!("MCP session revoke without a usable MCP session credential");
        CommonWebError::NotAuthorized
      })?;

  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let revoked_rows = revoke_mcp_session(RevokeMcpSessionArgs {
    private_session_token: &private_session_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("revoke_mcp_session failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // An unknown or already-terminated session is a 401, not a leak of which case occurred.
  if revoked_rows == 0 {
    warn!("No revocable MCP session for presented credential");
    return Err(CommonWebError::NotAuthorized);
  }

  Ok(Json(RevokeMcpSessionSuccessResponse { success: true }))
}
