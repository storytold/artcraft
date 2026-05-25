use std::sync::Arc;

use actix_web::web::{self, Json};
use actix_web::HttpRequest;
use log::warn;

use artcraft_api_defs::user_referral_codes::list_referral_codes::{ListReferralCodesResponse, ReferralCodeEntry};
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use mysql_queries::queries::user_referral_codes::list_referral_codes_for_user::list_referral_codes_for_user;

/// List all active referral codes for the logged-in user.
#[utoipa::path(
  get,
  tag = "User Referral Codes",
  path = "/v1/user_referral_codes/list",
  responses(
    (status = 200, description = "Success", body = ListReferralCodesResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn list_referral_codes_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListReferralCodesResponse>, CommonWebError> {
  let mut mysql_connection = server_state.mysql_pool.acquire().await
    .map_err(|e| CommonWebError::from(e))?;

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      CommonWebError::from(e)
    })?;

  let user_session = match maybe_user_session {
    Some(session) if !session.is_banned => session,
    _ => return Err(CommonWebError::NotAuthorized),
  };

  let user_token = &user_session.user_token;

  let rows = list_referral_codes_for_user(user_token, &mut *mysql_connection).await
    .map_err(|e| CommonWebError::from(e))?;

  let referral_codes = rows.into_iter().map(|r| ReferralCodeEntry {
    token: r.token,
    code: r.code,
    code_lowercase: r.code_lowercase,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }).collect();

  Ok(Json(ListReferralCodesResponse {
    success: true,
    referral_codes,
  }))
}
