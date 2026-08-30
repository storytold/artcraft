use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::mcp_sessions::common::McpSessionPathInfo;
use artcraft_api_defs::mcp_sessions::delete_mcp_session::DeleteMcpSessionSuccessResponse;
use mysql_queries::queries::mcp_sessions::delete_mcp_session::{
  delete_mcp_session, DeleteMcpSessionArgs,
};
use mysql_queries::queries::mcp_sessions::get_mcp_session_by_token::{
  get_mcp_session_by_token, GetMcpSessionByTokenArgs,
};
use tokens::tokens::mcp_sessions::McpSessionToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::api_or_web_session::require_api_or_web_session::require_api_or_web_session;
use crate::state::server_state::ServerState;

/// Terminate an MCP session by its management `token`, scoped to the authenticated user (API
/// key or web session). This is the dashboard path; a session revoking ITSELF uses
/// `/v1/mcp/session/revoke` with its private credential instead.
#[utoipa::path(
  post,
  tag = "MCP Sessions",
  path = "/v1/mcp/session/{token}/delete",
  params(("token" = McpSessionToken, description = "The session's management token (not the private credential)")),
  responses(
    (status = 200, body = DeleteMcpSessionSuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn delete_mcp_session_handler(
  http_request: HttpRequest,
  path: Path<McpSessionPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<DeleteMcpSessionSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_api_or_web_session(
    &http_request,
    &server_state.session_checker,
    &server_state.avt_cookie_manager,
    &mut *conn,
  ).await?;

  // The by-token delete query isn't owner-scoped, so first look the session up and confirm
  // ownership. Return NotFound for missing OR other-owned sessions, so we never leak the
  // existence of another user's session.
  let row = get_mcp_session_by_token(GetMcpSessionByTokenArgs {
    token: &path.token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("get_mcp_session_by_token failed: {:?}", err);
    CommonWebError::from_error(err)
  })?
  .filter(|row| row.user_token == user_session.user_token)
  .ok_or(CommonWebError::NotFound)?;

  // Only issue the delete if the session is still live. If it's already terminated the desired
  // end state already holds, so treat it as success.
  if row.maybe_deleted_at.is_none() {
    delete_mcp_session(DeleteMcpSessionArgs {
      token: &path.token,
      mysql_executor: &mut *conn,
      phantom: PhantomData,
    }).await.map_err(|err| {
      warn!("delete_mcp_session failed: {:?}", err);
      CommonWebError::from_error(err)
    })?;
  }

  Ok(Json(DeleteMcpSessionSuccessResponse { success: true }))
}
