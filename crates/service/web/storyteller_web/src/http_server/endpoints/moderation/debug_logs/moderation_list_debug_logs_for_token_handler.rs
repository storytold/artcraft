use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use mysql_queries::queries::debug_logs::list_debug_logs_for_token::{
  list_debug_logs_for_token, ListDebugLogsForTokenArgs,
};
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

// ── Path params ──

#[derive(Deserialize, ToSchema)]
pub struct ListDebugLogsPathInfo {
  pub token: DebugLogEventToken,
}

// ── Query params ──

#[derive(Deserialize, IntoParams, ToSchema)]
pub struct ListDebugLogsQueryParams {
  pub limit: Option<u32>,
}

// ── Response ──

#[derive(Serialize, ToSchema)]
pub struct ListDebugLogsSuccessResponse {
  pub success: bool,
  pub debug_logs: Vec<DebugLogEntry>,
}

#[derive(Serialize, ToSchema)]
pub struct DebugLogEntry {
  pub id: u64,
  pub event_token: DebugLogEventToken,
  pub debug_log_type: DebugLogType,
  pub maybe_creator_user_token: Option<UserToken>,
  pub message: String,
  pub created_at: DateTime<Utc>,
}

// ── Handler ──

#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/debug_logs/list/{token}",
  params(
    ("token" = String, Path, description = "Debug log event token"),
    ListDebugLogsQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ListDebugLogsSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderation_list_debug_logs_for_token_handler(
  http_request: HttpRequest,
  path: web::Path<ListDebugLogsPathInfo>,
  query: web::Query<ListDebugLogsQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListDebugLogsSuccessResponse>, AdvancedCommonWebError> {
  let _user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    AdvancedCommonWebError::NotAuthorized
  })?;

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let rows = list_debug_logs_for_token(ListDebugLogsForTokenArgs {
    event_token: &path.token,
    limit: query.limit,
    mysql_executor: &mut *mysql_connection,
    phantom: Default::default(),
  }).await.map_err(|err| {
    warn!("Error listing debug logs for token {}: {:?}", path.token, err);
    AdvancedCommonWebError::from_error(err)
  })?;

  let debug_logs: Vec<DebugLogEntry> = rows.into_iter().map(|row| {
    DebugLogEntry {
      id: row.id,
      event_token: row.event_token,
      debug_log_type: row.debug_log_type,
      maybe_creator_user_token: row.maybe_creator_user_token,
      message: row.message,
      created_at: row.created_at,
    }
  }).collect();

  Ok(Json(ListDebugLogsSuccessResponse {
    success: true,
    debug_logs,
  }))
}
