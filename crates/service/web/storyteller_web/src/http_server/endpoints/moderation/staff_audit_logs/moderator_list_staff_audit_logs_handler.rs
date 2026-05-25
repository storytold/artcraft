use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use mysql_queries::queries::staff_audit_logs::list_staff_audit_logs::{
  list_staff_audit_logs, ListStaffAuditLogsArgs,
};
use tokens::tokens::staff_audit_logs::StaffAuditLogToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "modstfaud";
const DEFAULT_LIMIT: u32 = 50;
const MAX_LIMIT: u32 = 1000;

// --- Request ---

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListStaffAuditLogsQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}

// --- Response ---

#[derive(Serialize, ToSchema)]
pub struct ListStaffAuditLogsSuccessResponse {
  pub success: bool,
  pub audit_logs: Vec<StaffAuditLogResponse>,
  pub maybe_cursor: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct StaffAuditLogResponse {
  pub token: StaffAuditLogToken,
  pub audit_action: String,
  pub maybe_entity_type: Option<String>,
  pub maybe_entity_token: Option<String>,
  pub maybe_target_username: Option<String>,
  pub maybe_target_display_name: Option<String>,
  pub staff_user_token: Option<UserToken>,
  pub staff_username: Option<String>,
  pub staff_display_name: Option<String>,
  pub staff_ip_address: String,
  pub created_at: DateTime<Utc>,
}

// --- Handler ---

/// List all staff audit logs. Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/staff_audit_logs/list",
  params(
    ListStaffAuditLogsQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ListStaffAuditLogsSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_list_staff_audit_logs_handler(
  http_request: HttpRequest,
  query: Query<ListStaffAuditLogsQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListStaffAuditLogsSuccessResponse>, CommonWebError> {

  let _user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    CommonWebError::NotAuthorized
  })?;

  let limit = query.limit
      .unwrap_or(DEFAULT_LIMIT)
      .min(MAX_LIMIT);

  let maybe_cursor_id = match &query.cursor {
    None => None,
    Some(cursor_str) => {
      let decoded = server_state.opaque_cursors
          .decode_cursor_expecting_name(CURSOR_NAME, cursor_str)
          .map_err(|err| {
            warn!("Failed to decode cursor: {:?}", err);
            CommonWebError::BadInputWithSimpleMessage(
              "Invalid cursor".to_string())
          })?;
      decoded.last_id
    }
  };

  let records = list_staff_audit_logs(
    ListStaffAuditLogsArgs {
      maybe_cursor_id,
      limit,
      mysql_pool: &server_state.mysql_pool,
    },
  ).await.map_err(|err| {
    warn!("Failed to list staff audit logs: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_cursor = records.last().map(|last| {
    server_state.opaque_cursors
        .encode_last_id_cursor(CURSOR_NAME, last.id)
  }).transpose().map_err(|err| {
    warn!("Failed to encode cursor: {:?}", err);
    CommonWebError::server_error_with_message("Failed to encode cursor")
  })?;

  let audit_logs = records.into_iter().map(|r| {
    StaffAuditLogResponse {
      token: r.token,
      audit_action: r.audit_action,
      maybe_entity_type: r.maybe_entity_type,
      maybe_entity_token: r.maybe_entity_token,
      maybe_target_username: r.maybe_target_username,
      maybe_target_display_name: r.maybe_target_display_name,
      staff_user_token: r.staff_user_token,
      staff_username: r.staff_username,
      staff_display_name: r.staff_display_name,
      staff_ip_address: r.staff_ip_address,
      created_at: r.created_at,
    }
  }).collect();

  Ok(Json(ListStaffAuditLogsSuccessResponse {
    success: true,
    audit_logs,
    maybe_cursor,
  }))
}
