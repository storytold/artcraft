use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use serde_derive::Deserialize;

use artcraft_api_defs::internal::minimax_jobs::mark_minimax_job_failure::{
  MarkMinimaxJobFailureRequest, MarkMinimaxJobFailureResponse,
};
use mysql_queries::queries::generic_inference::first_party::minimax_h3::get_first_party_minimax_h3_job_by_token::{
  get_first_party_minimax_h3_job_by_token, GetFirstPartyMinimaxH3JobByTokenArgs,
};
use mysql_queries::queries::generic_inference::first_party::minimax_h3::mark_first_party_minimax_h3_job_failed::{
  mark_first_party_minimax_h3_job_failed, MarkFirstPartyMinimaxH3JobFailedArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::require_internal_api_key::require_internal_api_key;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct MarkMinimaxJobFailurePathInfo {
  job_token: InferenceJobToken,
}

/// Internal (worker-facing): mark a first-party Minimax job as failed.
#[utoipa::path(
  post,
  tag = "Internal (Minimax Jobs)",
  path = "/v1/internal/minimax_jobs/job/{job_token}/failure",
  request_body = MarkMinimaxJobFailureRequest,
  params(
    ("job_token" = String, Path, description = "The inference job token"),
  ),
  responses(
    (status = 200, description = "Success", body = MarkMinimaxJobFailureResponse),
    (status = 401, description = "Missing or invalid internal API key"),
    (status = 404, description = "No such minimax job"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn mark_minimax_job_failure_handler(
  http_request: HttpRequest,
  path: web::Path<MarkMinimaxJobFailurePathInfo>,
  request: Json<MarkMinimaxJobFailureRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<MarkMinimaxJobFailureResponse>, CommonWebError> {

  require_internal_api_key(&http_request, &server_state)?;

  let job_token = &path.job_token;

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let maybe_job = get_first_party_minimax_h3_job_by_token(GetFirstPartyMinimaxH3JobByTokenArgs {
    job_token,
    mysql_executor: &mut *mysql_connection,
    phantom: Default::default(),
  }).await.map_err(|err| {
    error!("Error looking up minimax job {}: {:?}", job_token, err);
    CommonWebError::from_error(err)
  })?;

  let Some(job) = maybe_job else {
    warn!("No such minimax job: {}", job_token);
    return Err(CommonWebError::NotFound);
  };

  // Worker-supplied text is shown to users; strip control characters.
  // (The query clamps both reasons to the columns' 512 characters.)
  let maybe_user_failure_reason = request.maybe_user_failure_reason
    .as_deref()
    .map(sanitize_user_failure_reason)
    .filter(|reason| !reason.is_empty());

  mark_first_party_minimax_h3_job_failed(MarkFirstPartyMinimaxH3JobFailedArgs {
    job_token: &job.job_token,
    maybe_frontend_failure_category: request.maybe_frontend_failure_category,
    maybe_failure_reason: maybe_user_failure_reason.as_deref(),
    maybe_internal_debugging_failure_reason: request.maybe_internal_debugging_failure_reason.as_deref(),
    maybe_execution_duration_millis: request.execution_duration_millis,
    maybe_inference_duration_millis: request.inference_duration_millis,
    mysql_executor: &mut *mysql_connection,
    phantom: Default::default(),
  }).await.map_err(|err| {
    error!("Error marking minimax job {} failed: {:?}", job_token, err);
    CommonWebError::from_error(err)
  })?;

  info!("Minimax job {} marked as failed (category: {:?})",
    job.job_token, request.maybe_frontend_failure_category);

  Ok(Json(MarkMinimaxJobFailureResponse {
    success: true,
  }))
}

/// Replace control characters (including newlines) with spaces and trim.
fn sanitize_user_failure_reason(reason: &str) -> String {
  reason
    .chars()
    .map(|c| if c.is_control() { ' ' } else { c })
    .collect::<String>()
    .trim()
    .to_string()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn sanitize_strips_control_characters() {
    assert_eq!(sanitize_user_failure_reason("line one\nline two\r\n"), "line one line two");
    assert_eq!(sanitize_user_failure_reason("\t  spaced  \t"), "spaced");
    assert_eq!(sanitize_user_failure_reason("\u{0000}\u{0007}"), "");
    assert_eq!(sanitize_user_failure_reason("plain reason"), "plain reason");
  }
}
