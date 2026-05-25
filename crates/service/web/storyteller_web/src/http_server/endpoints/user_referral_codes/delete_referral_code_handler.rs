use std::sync::Arc;

use actix_web::web::{self, Json};
use actix_web::HttpRequest;
use log::warn;

use artcraft_api_defs::user_referral_codes::delete_referral_code::{DeleteReferralCodePathInfo, DeleteReferralCodeResponse};
use tokens::tokens::user_referral_codes::UserReferralCodeToken;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use mysql_queries::queries::user_referral_codes::soft_delete_referral_code::soft_delete_referral_code;

/// Delete (soft-delete) a referral code owned by the logged-in user.
#[utoipa::path(
  delete,
  tag = "User Referral Codes",
  path = "/v1/user_referral_codes/code/{token}",
  params(
    ("token" = UserReferralCodeToken, description = "The referral code token to delete"),
  ),
  responses(
    (status = 200, description = "Success", body = DeleteReferralCodeResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn delete_referral_code_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  path: web::Path<DeleteReferralCodePathInfo>,
) -> Result<Json<DeleteReferralCodeResponse>, CommonWebError> {
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

  let deleted = soft_delete_referral_code(
    &path.token,
    user_token,
    &mut *mysql_connection,
  ).await
    .map_err(|e| CommonWebError::from(e))?;

  if !deleted {
    return Err(CommonWebError::NotAuthorized);
  }

  Ok(Json(DeleteReferralCodeResponse {
    success: true,
  }))
}
