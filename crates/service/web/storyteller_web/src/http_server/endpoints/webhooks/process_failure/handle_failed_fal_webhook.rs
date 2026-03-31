use actix_web::web::Json;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::get_inference_job_by_fal_id::get_inference_job_by_fal_id;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token, MarkJobFailedByTokenArgs};
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use serde_json::Value;

use crate::http_server::endpoints::webhooks::fal_webhook_handler::FalWebhookError;
use crate::http_server::endpoints::webhooks::process_failure::fal_error_detail::{parse_fal_error_details, summarize_fal_error_details};
use crate::state::server_state::ServerState;

/// Handle a FAL webhook with status ERROR.
///
/// Parses the error details from the payload, looks up the job, and marks it as failed.
pub async fn handle_failed_fal_webhook(
  server_state: &ServerState,
  request_id: &str,
  payload: &Value,
  maybe_top_level_error: Option<&str>,
) -> Result<Json<SimpleGenericJsonSuccess>, FalWebhookError> {

  // Parse the "detail" array from the payload.
  let error_details = parse_fal_error_details(payload);
  let error_summary = summarize_fal_error_details(&error_details);

  info!(
    "FAL webhook ERROR for request_id {}: top_level_error={:?}, details=[{}]",
    request_id,
    maybe_top_level_error,
    error_summary,
  );

  // Look up the job record.
  let job = match get_inference_job_by_fal_id(request_id, &server_state.mysql_pool).await {
    Ok(Some(record)) => record,
    Ok(None) => {
      warn!("Could not find job record by fal request_id: {}", request_id);
      return Err(FalWebhookError::NotFound);
    }
    Err(err) => {
      error!("Error querying job record for request_id {}: {:?}", request_id, err);
      return Err(FalWebhookError::ServerError);
    }
  };

  // Build a failure reason from the error details or the top-level error string.
  let public_failure_reason = if !error_details.is_empty() {
    error_details.iter()
        .filter_map(|d| d.msg.as_deref())
        .collect::<Vec<_>>()
        .join("; ")
  } else if let Some(top_level) = maybe_top_level_error {
    top_level.to_string()
  } else {
    "Unknown FAL error".to_string()
  };

  let internal_failure_reason = format!(
    "FAL request_id={}, top_level_error={:?}, details=[{}]",
    request_id,
    maybe_top_level_error,
    error_summary,
  );

  info!(
    "Marking job {} as failed for request_id {}. Reason: {}",
    job.job_token.as_str(),
    request_id,
    public_failure_reason,
  );

  if let Err(err) = mark_job_failed_by_token(MarkJobFailedByTokenArgs {
    pool: &server_state.mysql_pool,
    job_token: &job.job_token,
    maybe_public_failure_reason: Some(&public_failure_reason),
    internal_debugging_failure_reason: &internal_failure_reason,
    maybe_frontend_failure_category: None,
  }).await {
    error!(
      "Error marking job {} as failed for request_id {}: {:?}",
      job.job_token.as_str(),
      request_id,
      err,
    );
    return Err(FalWebhookError::ServerError);
  }

  info!(
    "Job {} marked as failed for request_id {}.",
    job.job_token.as_str(),
    request_id,
  );

  Ok(SimpleGenericJsonSuccess::wrapped(true))
}
