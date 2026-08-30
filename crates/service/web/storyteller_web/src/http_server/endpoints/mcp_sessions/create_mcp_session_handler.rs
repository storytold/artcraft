use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::mcp_sessions::create_mcp_session::{
  CreateMcpSessionRequest, CreateMcpSessionSuccessResponse,
};
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::mcp_sessions::insert_mcp_session::{
  insert_mcp_session, InsertMcpSessionArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::api_or_web_session::require_api_or_web_session::require_api_or_web_session;
use crate::state::server_state::ServerState;

const MAX_CLIENT_FIELD_LEN: usize = 255;

/// Create a new MCP session for the authenticated user (API key or web session). The secret
/// `private_session_token` is returned exactly once in this response — it can never be
/// retrieved again afterward.
#[utoipa::path(
  post,
  tag = "MCP Sessions",
  path = "/v1/mcp/session/create",
  request_body = CreateMcpSessionRequest,
  responses(
    (status = 200, body = CreateMcpSessionSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn create_mcp_session_handler(
  http_request: HttpRequest,
  request: Json<CreateMcpSessionRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<CreateMcpSessionSuccessResponse>, CommonWebError> {
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

  let maybe_client_name = validated_client_field("client name", &request.maybe_mcp_client_name)?;
  let maybe_client_version = validated_client_field("client version", &request.maybe_mcp_client_version)?;
  let maybe_client_vendor = validated_client_field("client vendor", &request.maybe_mcp_client_vendor)?;

  let ip_address = get_request_ip(&http_request);

  let inserted = insert_mcp_session(InsertMcpSessionArgs {
    user_token: &user_session.user_token,
    ip_address: &ip_address,
    maybe_mcp_client_name: maybe_client_name.as_deref(),
    maybe_mcp_client_version: maybe_client_version.as_deref(),
    maybe_mcp_client_vendor: maybe_client_vendor.as_deref(),
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("insert_mcp_session failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(CreateMcpSessionSuccessResponse {
    success: true,
    // The only time the session credential is ever exposed. The refresh token is exposed again
    // only as the rotated replacement in refresh responses.
    private_session_token: inserted.private_session_token,
    private_refresh_token: inserted.private_refresh_token,
  }))
}

/// Trim an optional client-supplied field; an empty (or whitespace-only) value becomes `None`,
/// and an overlong value is a 400.
fn validated_client_field(
  field_name: &str,
  maybe_value: &Option<String>,
) -> Result<Option<String>, CommonWebError> {
  let trimmed = match maybe_value {
    Some(value) => value.trim(),
    None => return Ok(None),
  };

  if trimmed.is_empty() {
    return Ok(None);
  }
  if trimmed.len() > MAX_CLIENT_FIELD_LEN {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("{} too long (max {} chars)", field_name, MAX_CLIENT_FIELD_LEN),
    ));
  }

  Ok(Some(trimmed.to_string()))
}
