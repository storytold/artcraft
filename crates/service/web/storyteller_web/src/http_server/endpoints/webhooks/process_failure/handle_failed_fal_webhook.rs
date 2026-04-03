use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use fal_client::webhook_api::payload::webhook_error_type::WebhookErrorType;
use fal_client::webhook_api::payload::webhook_inner_payload::ErrorData;
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::get_inference_job_by_fal_id::get_inference_job_by_fal_id;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token, MarkJobFailedByTokenArgs};

/// Handle a FAL webhook with status ERROR.
///
/// Looks up the job by request_id and marks it as failed using the parsed error data.
pub async fn handle_failed_fal_webhook(
  server_state: &ServerState,
  request_id: &str,
  error_data: &ErrorData,
  maybe_top_level_error: Option<&str>,
) -> Result<Json<SimpleGenericJsonSuccess>, AdvancedCommonWebError> {

  info!(
    "FAL webhook ERROR for request_id {}: top_level_error={:?}, error_type={:?}, message={:?}",
    request_id,
    maybe_top_level_error,
    error_data.error_type,
    error_data.message,
  );

  // Look up the job record.
  let job = match get_inference_job_by_fal_id(request_id, &server_state.mysql_pool).await {
    Ok(Some(record)) => record,
    Ok(None) => {
      warn!("Could not find job record by fal request_id: {}", request_id);
      return Err(AdvancedCommonWebError::NotFound);
    }
    Err(err) => {
      error!("Error querying job record for request_id {}: {:?}", request_id, err);
      return Err(AdvancedCommonWebError::from_anyhow_error(err));
    }
  };

  // Build a failure reason from the error data or the top-level error string.
  let public_failure_reason = if let Some(msg) = &error_data.message {
    msg.clone()
  } else if let Some(top_level) = maybe_top_level_error {
    top_level.to_string()
  } else {
    "Unknown FAL error".to_string()
  };

  let internal_failure_reason = format!(
    "FAL request_id={}, top_level_error={:?}, error_type={:?}, message={:?}",
    request_id,
    maybe_top_level_error,
    error_data.error_type,
    error_data.message,
  );

  let failure_category = guess_failure_category(error_data.error_type.as_ref());

  info!(
    "Marking job {} as failed for request_id {}. Category: {:?}, Reason: {}",
    job.job_token.as_str(),
    request_id,
    failure_category,
    public_failure_reason,
  );

  if let Err(err) = mark_job_failed_by_token(MarkJobFailedByTokenArgs {
    pool: &server_state.mysql_pool,
    job_token: &job.job_token,
    maybe_public_failure_reason: Some(&public_failure_reason),
    internal_debugging_failure_reason: &internal_failure_reason,
    maybe_frontend_failure_category: Some(failure_category),
  }).await {
    error!(
      "Error marking job {} as failed for request_id {}: {:?}",
      job.job_token.as_str(),
      request_id,
      err,
    );
    return Err(AdvancedCommonWebError::from_anyhow_error(err));
  }

  info!(
    "Job {} marked as failed for request_id {}.",
    job.job_token.as_str(),
    request_id,
  );

  Ok(SimpleGenericJsonSuccess::wrapped(true))
}

// =============== Private helpers ===============

/// Map a FAL WebhookErrorType to a frontend failure category.
///
/// Returns `GenerationFailed` as the default if the error type is None or unrecognized.
fn guess_failure_category(error_type: Option<&WebhookErrorType>) -> FrontendFailureCategory {
  match error_type {
    Some(WebhookErrorType::ContentPolicyViolation) => FrontendFailureCategory::RuleBansUserContent,
    Some(WebhookErrorType::FaceDetectionError) => FrontendFailureCategory::FaceNotDetected,
    Some(WebhookErrorType::FileTooLarge) => FrontendFailureCategory::FilesizeTooLarge,
    Some(WebhookErrorType::ImageTooLarge) => FrontendFailureCategory::ImageDimensionsTooLarge,
    Some(WebhookErrorType::ImageTooSmall) => FrontendFailureCategory::ImageDimensionsTooSmall,
    Some(WebhookErrorType::NoMediaGenerated)
    | Some(WebhookErrorType::ImageLoadError)
    | Some(WebhookErrorType::FileDownloadError) => FrontendFailureCategory::GenerationFailed,
    _ => FrontendFailureCategory::GenerationFailed,
  }
}
