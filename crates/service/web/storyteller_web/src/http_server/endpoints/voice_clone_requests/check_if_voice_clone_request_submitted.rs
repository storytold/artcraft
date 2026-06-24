use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::web::Json;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest};
use log::warn;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::voice_clone_requests::get_voice_clone_request::{get_voice_clone_request_by_token, get_voice_clone_request_by_user_token};

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

#[derive(Deserialize)]
pub struct CheckIfVoiceRequestSubmittedRequest {
  /// Though we look up logged in users by user token, we can also look up non-logged-in users
  /// with a token lookup. We can store this in frontend state or a cookie.
  pub maybe_request_token: Option<String>,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct CheckIfVoiceRequestSubmittedResponse {
  pub success: bool,
  pub has_submitted: bool,
}

// =============== Error Response ===============
// NB: Not using DeriveMore since Clion doesn't understand it.
// =============== Handler ===============

pub async fn check_if_voice_clone_request_submitted_handler(
  http_request: HttpRequest,
  request: Json<CheckIfVoiceRequestSubmittedRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<CheckIfVoiceRequestSubmittedResponse>, CommonWebError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let mut submitted_by_token = false;
  let mut submitted_by_user = false;

  // Non-logged in accounts (via cookie or frontend mechanism)
  if let Some(token) = request.maybe_request_token.as_deref() {
    let request = get_voice_clone_request_by_token(
      token, &server_state.mysql_pool)
        .await
        .map_err(|e| {
          warn!("Database error: {:?}", e);
          CommonWebError::from_anyhow_error(e)
        })?;

    submitted_by_token = request.is_some();
  }

  // Logged in users
  if let Some(user) = maybe_user_session.as_ref() {
    let request = get_voice_clone_request_by_user_token(
      user.user_token.as_str(), &server_state.mysql_pool)
        .await
        .map_err(|e| {
          warn!("Database error: {:?}", e);
          CommonWebError::from_anyhow_error(e)
        })?;

    submitted_by_user = request.is_some();
  }

  let has_submitted = submitted_by_token || submitted_by_user;

  let response = CheckIfVoiceRequestSubmittedResponse {
    success: true,
    has_submitted,
  };

  Ok(Json(response))
}
