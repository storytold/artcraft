use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::debug_logs::debug_log_entry::{ModerationDebugLogEntry, ModerationDebugLogUser};
use artcraft_api_defs::moderation::debug_logs::moderation_list_debug_logs_for_user::{
  ModerationListDebugLogsForUserPathInfo, ModerationListDebugLogsForUserQueryParams,
  ModerationListDebugLogsForUserSuccessResponse,
};
use mysql_queries::queries::debug_logs::list_debug_logs_for_user::{
  list_debug_logs_for_user, ListDebugLogsForUserArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;

#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/debug_logs/user_list/{user_token}",
  params(
    ("user_token" = String, Path, description = "User token"),
    ModerationListDebugLogsForUserQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ModerationListDebugLogsForUserSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderation_list_debug_logs_for_user_handler(
  http_request: HttpRequest,
  path: web::Path<ModerationListDebugLogsForUserPathInfo>,
  query: web::Query<ModerationListDebugLogsForUserQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModerationListDebugLogsForUserSuccessResponse>, CommonWebError> {
  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let _user_session = require_moderator(&http_request, &server_state.session_checker, &mut *mysql_connection).await?;

  let result = list_debug_logs_for_user(ListDebugLogsForUserArgs {
    user_token: &path.user_token,
    maybe_id_cursor: query.cursor,
    limit: query.limit,
    mysql_executor: &mut *mysql_connection,
    phantom: Default::default(),
  }).await.map_err(|err| {
    warn!("Error listing debug logs for user {}: {:?}", path.user_token, err);
    CommonWebError::from_error(err)
  })?;

  let debug_logs: Vec<ModerationDebugLogEntry> = result.debug_logs.into_iter().map(|row| {
    // The join only yields user fields when the creator user exists.
    let maybe_user = match (row.maybe_creator_user_token.clone(), row.maybe_user_display_name, row.maybe_user_username, row.maybe_user_gravatar_hash) {
      (Some(user_token), Some(display_name), Some(username), Some(gravatar_hash)) => {
        Some(ModerationDebugLogUser {
          user_token,
          display_name,
          username,
          gravatar_hash,
        })
      }
      _ => None,
    };

    ModerationDebugLogEntry {
      id: row.id,
      event_token: row.event_token,
      debug_log_type: row.debug_log_type,
      maybe_log_level: row.maybe_log_level,
      maybe_creator_user_token: row.maybe_creator_user_token,
      maybe_ip_address: row.maybe_ip_address,
      maybe_url: row.maybe_url,
      message: row.message,
      created_at: row.created_at,
      maybe_user,
    }
  }).collect();

  Ok(Json(ModerationListDebugLogsForUserSuccessResponse {
    success: true,
    debug_logs,
    next_cursor: result.next_cursor,
  }))
}
