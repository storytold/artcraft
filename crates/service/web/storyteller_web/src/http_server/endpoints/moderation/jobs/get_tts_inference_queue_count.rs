use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::web::Json;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest};
use log::warn;

use mysql_queries::queries::tts::tts_inference_jobs::get_pending_tts_inference_job_detailed_stats::{get_pending_tts_inference_job_detailed_stats, PendingCountResult};

use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct GetTtsInferenceQueueCountResponse {
  pub success: bool,
  // Seconds since job at head of queue was enqueued (proxy for queue wait time)
  pub seconds_since_first: i64,

  // All "pending" jobs
  pub pending_count: i64,

  // All "pending" jobs with priority > 0
  pub pending_priority_nonzero_count: i64,

  // All "pending" jobs with priority > 1
  pub pending_priority_gt_one_count: i64,

  // Failed, but not permanently dead
  pub attempt_failed_count: i64,
}
// NB: Not using DeriveMore since Clion doesn't understand it.
pub async fn get_tts_inference_queue_count_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GetTtsInferenceQueueCountResponse>, CommonWebError> {

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
  if !user_session.can_ban_users {
    warn!("user is not allowed to view bans: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  let result = get_pending_tts_inference_job_detailed_stats(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("get tts pending count error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?
      .unwrap_or(
        // NB: Not Found for null results means nothing is pending in the queue (not an error!)
        PendingCountResult {
          seconds_since_first: 0,
          pending_count: 0,
          pending_priority_nonzero_count: 0,
          pending_priority_gt_one_count: 0,
          attempt_failed_count: 0,
        }
      );

  let response = GetTtsInferenceQueueCountResponse {
    success: true,
    seconds_since_first: result.seconds_since_first,
    pending_count: result.pending_count,
    pending_priority_nonzero_count: result.pending_priority_nonzero_count,
    pending_priority_gt_one_count: result.pending_priority_gt_one_count,
    attempt_failed_count: result.attempt_failed_count,
  };

  Ok(Json(response))
}
