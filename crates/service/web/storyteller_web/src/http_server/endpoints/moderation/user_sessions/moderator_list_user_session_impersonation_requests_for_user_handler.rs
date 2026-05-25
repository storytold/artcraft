use std::sync::Arc;

use actix_web::web::{Json, Path, Query};
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use mysql_queries::queries::user_impersonation_requests::list_user_impersonation_requests_for_user::{
  list_user_impersonation_requests_for_user, ListUserImpersonationRequestsArgs,
};
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "moduserimp";
const DEFAULT_LIMIT: u32 = 50;
const MAX_LIMIT: u32 = 1000;

// --- Request ---

#[derive(Deserialize, ToSchema)]
pub struct ListImpersonationRequestsPathInfo {
  user_token: UserToken,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListImpersonationRequestsQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}

// --- Response ---

#[derive(Serialize, ToSchema)]
pub struct ListUserImpersonationRequestsSuccessResponse {
  pub success: bool,
  pub impersonation_requests: Vec<UserImpersonationRequestResponse>,
  pub maybe_cursor: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct UserImpersonationRequestResponse {
  pub impersonator_user_token: UserToken,
  pub impersonator_username: String,
  pub impersonator_display_name: String,
  pub impersonated_user_token: UserToken,
  pub impersonated_username: String,
  pub impersonated_display_name: String,
  pub is_redeemed: bool,
  pub is_expired: bool,
  pub expires_at: DateTime<Utc>,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

// --- Handler ---

/// List impersonation requests for a given user. Moderators only.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_sessions/impersonation_requests/user/{user_token}",
  params(
    ListImpersonationRequestsQueryParams,
  ),
  responses(
    (status = 200, description = "Success", body = ListUserImpersonationRequestsSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_list_user_session_impersonation_requests_for_user_handler(
  http_request: HttpRequest,
  path: Path<ListImpersonationRequestsPathInfo>,
  query: Query<ListImpersonationRequestsQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListUserImpersonationRequestsSuccessResponse>, CommonWebError> {

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

  let records = list_user_impersonation_requests_for_user(
    ListUserImpersonationRequestsArgs {
      user_token: path.user_token.as_str(),
      maybe_cursor_id,
      limit,
      mysql_pool: &server_state.mysql_pool,
    },
  ).await.map_err(|err| {
    warn!("Failed to list impersonation requests: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_cursor = records.last().map(|last| {
    server_state.opaque_cursors
        .encode_last_id_cursor(CURSOR_NAME, last.id)
  }).transpose().map_err(|err| {
    warn!("Failed to encode cursor: {:?}", err);
    CommonWebError::server_error_with_message("Failed to encode cursor")
  })?;

  let impersonation_requests = records.into_iter().map(|r| {
    UserImpersonationRequestResponse {
      impersonator_user_token: r.impersonator_user_token,
      impersonator_username: r.impersonator_username,
      impersonator_display_name: r.impersonator_display_name,
      impersonated_user_token: r.impersonated_user_token,
      impersonated_username: r.impersonated_username,
      impersonated_display_name: r.impersonated_display_name,
      is_redeemed: r.is_redeemed,
      is_expired: r.is_expired,
      expires_at: r.expires_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }
  }).collect();

  Ok(Json(ListUserImpersonationRequestsSuccessResponse {
    success: true,
    impersonation_requests,
    maybe_cursor,
  }))
}
