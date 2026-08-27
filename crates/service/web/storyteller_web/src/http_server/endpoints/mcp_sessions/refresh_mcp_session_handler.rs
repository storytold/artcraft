use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::mcp_sessions::refresh_mcp_session::RefreshMcpSessionSuccessResponse;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::mcp_sessions::refresh_mcp_session::{
  refresh_mcp_session, RefreshMcpSessionArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::get_authorization_header_mcp_private_session_token::get_authorization_header_mcp_private_session_token;
use crate::state::server_state::ServerState;

/// Refresh the calling MCP session (authenticated ONLY by its `private_session_token` in the
/// `Authorization` header), pushing its expiry two weeks out from now. A terminated or
/// already-expired session cannot refresh — that's a 401.
#[utoipa::path(
  post,
  tag = "MCP Sessions",
  path = "/v1/mcp/session/refresh",
  responses(
    (status = 200, body = RefreshMcpSessionSuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn refresh_mcp_session_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<RefreshMcpSessionSuccessResponse>, CommonWebError> {
  let private_session_token =
    get_authorization_header_mcp_private_session_token(&http_request)
      .ok_or_else(|| {
        warn!("MCP session refresh without a usable MCP session credential");
        CommonWebError::NotAuthorized
      })?;

  let ip_address = get_request_ip(&http_request);

  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let refreshed_rows = refresh_mcp_session(RefreshMcpSessionArgs {
    private_session_token: &private_session_token,
    ip_address: &ip_address,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("refresh_mcp_session failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // An unknown, terminated, or expired session is a 401, not a leak of which case occurred.
  if refreshed_rows == 0 {
    warn!("No refreshable MCP session for presented credential");
    return Err(CommonWebError::NotAuthorized);
  }

  Ok(Json(RefreshMcpSessionSuccessResponse { success: true }))
}
