use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use mysql_queries::queries::stats::get_voice_count_stats::get_voice_count_stats;

use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct GetVoiceCountStatsResponse {
  pub success: bool,
  pub all_voices_count_including_deleted: i64,
  pub public_voices_count: i64,
}
// NB: Not using DeriveMore since Clion doesn't understand it.
pub async fn get_voice_count_stats_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError> {

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  // TODO: Not a good fit for this permission.
  if !user_session.can_edit_other_users_tts_models {
    warn!("user is not allowed to edit user tts: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  let result = get_voice_count_stats(&server_state.mysql_pool)
      .await
      .map_err(|e| {
        CommonWebError::from_anyhow_error(e)
      })?;

  let response = GetVoiceCountStatsResponse {
    success: true,
    all_voices_count_including_deleted: result.all_count,
    public_voices_count: result.public_count,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

