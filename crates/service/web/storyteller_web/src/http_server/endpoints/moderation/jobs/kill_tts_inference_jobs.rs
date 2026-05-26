use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::tts::tts_inference_jobs::kill_tts_inference_jobs::{kill_tts_inference_jobs, JobStatus};

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

#[derive(Copy, Clone, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum KillAction {
  /// Kill all "pending" jobs
  AllPending,
  /// Kill all "pending" and "attempt_failed" jobs
  AllPendingAndFailed,
  /// Kill "pending" jobs with priority_level = 0.
  ZeroPriorityPending,
}

// NB: ONLY MODERATORS CAN EDIT CATEGORIES.
// These are not sparse updates!
#[derive(Deserialize)]
pub struct KillTtsInferenceJobsRequest {
  kill_action: KillAction,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct KillTtsInferenceJobsResponse {
  pub success: bool,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn kill_tts_inference_jobs_handler(
  http_request: HttpRequest,
  request: web::Json<KillTtsInferenceJobsRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
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

  // TODO: We don't have a permission for this, so use this as a proxy permission
  if !user_session.can_ban_users {
    warn!("no permission to edit categories");
    return Err(CommonWebError::NotAuthorized);
  }

  let job_status = match request.kill_action {
    KillAction::AllPending => JobStatus::AllPending,
    KillAction::AllPendingAndFailed => JobStatus::AllPendingAndFailed,
    KillAction::ZeroPriorityPending => JobStatus::ZeroPriorityPending,
  };

  kill_tts_inference_jobs(job_status, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        error!("Error with query: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let response = KillTtsInferenceJobsResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
