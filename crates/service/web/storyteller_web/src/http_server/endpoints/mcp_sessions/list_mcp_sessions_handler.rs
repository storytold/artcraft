use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::mcp_sessions::list_mcp_sessions::{
  ListMcpSessionsQueryParams, ListMcpSessionsSuccessResponse,
};
use mysql_queries::queries::mcp_sessions::list_mcp_sessions_for_user::{
  list_mcp_sessions_for_user, ListMcpSessionsForUserArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::mcp_sessions::mcp_session_info_conversion::mcp_session_row_to_info;
use crate::http_server::user_lookup::api_or_web_session::require_api_or_web_session::require_api_or_web_session;
use crate::state::server_state::ServerState;

const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

/// List the authenticated user's MCP sessions (API key or web session), newest first,
/// **including terminated** sessions. Paginated via `limit`/`offset`. Never returns the secret
/// `private_session_token` — only the management `token`.
#[utoipa::path(
  get,
  tag = "MCP Sessions",
  path = "/v1/mcp/session/list",
  params(ListMcpSessionsQueryParams),
  responses(
    (status = 200, body = ListMcpSessionsSuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_mcp_sessions_handler(
  http_request: HttpRequest,
  query: Query<ListMcpSessionsQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListMcpSessionsSuccessResponse>, CommonWebError> {
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

  let limit = query.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);
  let offset = query.offset.unwrap_or(0);

  let rows = list_mcp_sessions_for_user(ListMcpSessionsForUserArgs {
    user_token: &user_session.user_token,
    limit,
    offset,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("list_mcp_sessions_for_user failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let mcp_sessions = rows.into_iter().map(mcp_session_row_to_info).collect();

  Ok(Json(ListMcpSessionsSuccessResponse {
    success: true,
    mcp_sessions,
  }))
}
