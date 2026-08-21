use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use fal_client::webhook_payload::raw::webhook_error_type::WebhookErrorType;
use fal_client::webhook_payload::hydrated::hydrated_webhook_contents::ErrorData;
use http_server_common::response::response_success_helpers::SimpleGenericJsonSuccess;
use log::{error, info, warn};
use mysql_queries::queries::debug_logs::insert_debug_log::{insert_debug_log, InsertDebugLogArgs};
use mysql_queries::queries::generic_inference::api_providers::fal::get_inference_job_by_fal_id::get_inference_job_by_fal_id_from_connection;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token_from_connection, MarkJobFailedByTokenFromConnectionArgs};
use sqlx::pool::PoolConnection;
use sqlx::MySql;

/// Handle a FAL webhook with status ERROR.
///
/// Looks up the job by request_id and marks it as failed using the parsed error data.
pub async fn handle_failed_fal_webhook(
  server_state: &ServerState,
  mysql_connection: &mut PoolConnection<MySql>,
  request_id: &str,
  error_data: &ErrorData,
  maybe_top_level_error: Option<&str>,
  raw_body: &str,
) -> Result<Json<SimpleGenericJsonSuccess>, CommonWebError> {

  info!(
    "FAL webhook ERROR for request_id {}: top_level_error={:?}, error_type={:?}, message={:?}",
    request_id,
    maybe_top_level_error,
    error_data.error_type,
    error_data.message,
  );

  // Look up the job record.
  let job = match get_inference_job_by_fal_id_from_connection(request_id, mysql_connection).await {
    Ok(Some(record)) => record,
    Ok(None) => {
      warn!("Could not find job record by fal request_id: {}", request_id);
      return Err(CommonWebError::NotFound);
    }
    Err(err) => {
      error!("Error querying job record for request_id {}: {:?}", request_id, err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  // Insert debug log for the webhook payload.
  if let Some(debug_log_event_token) = &job.maybe_debug_log_event_token {
    if let Err(err) = insert_debug_log(InsertDebugLogArgs {
      apriori_debug_log_event_token: Some(debug_log_event_token),
      maybe_creator_user_token: job.maybe_creator_user_token.as_ref(),
      debug_log_type: DebugLogType::FalWebhook,
      maybe_log_level: Some(DebugLogLevel::Error),
      maybe_ip_address: None,
      maybe_url: None,
      message: raw_body,
      mysql_executor: &mut **mysql_connection,
      phantom: Default::default(),
    }).await {
      warn!("Failed to insert Fal webhook debug log: {:?}", err);
    }
  }

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

  let failure_category = guess_failure_category(
    error_data.error_type.as_ref(),
    error_data.message.as_deref(),
  );

  info!(
    "Marking job {} as failed for request_id {}. Category: {:?}, Reason: {}",
    job.job_token.as_str(),
    request_id,
    failure_category,
    public_failure_reason,
  );

  if let Err(err) = mark_job_failed_by_token_from_connection(MarkJobFailedByTokenFromConnectionArgs {
    mysql_connection,
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
    return Err(CommonWebError::from_anyhow_error(err));
  }

  info!(
    "Job {} marked as failed for request_id {}.",
    job.job_token.as_str(),
    request_id,
  );

  Ok(SimpleGenericJsonSuccess::wrapped(true))
}

// =============== Private helpers ===============

/// Map a FAL WebhookErrorType (and, for generic validation errors, the
/// human-readable message) to a frontend failure category.
///
/// Returns `GenerationFailed` as the default if the error type is None or unrecognized.
fn guess_failure_category(
  error_type: Option<&WebhookErrorType>,
  maybe_message: Option<&str>,
) -> FrontendFailureCategory {
  match error_type {
    Some(WebhookErrorType::ContentPolicyViolation) => FrontendFailureCategory::RuleBansUserContent,
    Some(WebhookErrorType::FaceDetectionError) => FrontendFailureCategory::FaceNotDetected,
    Some(WebhookErrorType::FileTooLarge) => FrontendFailureCategory::FilesizeTooLarge,
    Some(WebhookErrorType::ImageTooLarge) => FrontendFailureCategory::ImageDimensionsTooLarge,
    Some(WebhookErrorType::ImageTooSmall) => FrontendFailureCategory::ImageDimensionsTooSmall,
    // `input_value_error` / `value_error` are generic validation errors; the
    // message carries the specifics.
    Some(WebhookErrorType::InputValueError)
    | Some(WebhookErrorType::ValueError) => guess_validation_failure_category(maybe_message),
    Some(WebhookErrorType::NoMediaGenerated)
    | Some(WebhookErrorType::ImageLoadError)
    | Some(WebhookErrorType::FileDownloadError) => FrontendFailureCategory::GenerationFailed,
    _ => FrontendFailureCategory::GenerationFailed,
  }
}

/// Classify a generic fal validation error (`input_value_error` /
/// `value_error`) by its human-readable message.
fn guess_validation_failure_category(maybe_message: Option<&str>) -> FrontendFailureCategory {
  let Some(message) = maybe_message else {
    return FrontendFailureCategory::GenerationFailed;
  };

  let message = message.to_ascii_lowercase();

  // TripoSplat: "No foreground subject could be detected in the input image
  // after background removal. ..."
  if message.contains("no foreground subject") {
    return FrontendFailureCategory::NoForegroundSubjectDetected;
  }

  // Hunyuan 3D Part: "Part generation only supports FBX format. Please
  // provide an FBX file or use /convert-format to convert your model to FBX
  // first."
  if message.contains("only supports") && message.contains("format") {
    return FrontendFailureCategory::FormatNotSupported;
  }

  FrontendFailureCategory::GenerationFailed
}

#[cfg(test)]
mod tests {
  use super::*;

  const NO_FOREGROUND_SUBJECT_MESSAGE: &str =
      "No foreground subject could be detected in the input image after background removal. \
       Provide an image with a clear, visible subject against a plain or distinct background.";

  const FBX_ONLY_MESSAGE: &str =
      "Part generation only supports FBX format. Please provide an FBX file or use \
       /convert-format to convert your model to FBX first.";

  mod guess_failure_category_tests {
    use super::*;

    #[test]
    fn input_value_error_with_no_foreground_subject_message() {
      let category = guess_failure_category(
        Some(&WebhookErrorType::InputValueError),
        Some(NO_FOREGROUND_SUBJECT_MESSAGE),
      );
      assert_eq!(category, FrontendFailureCategory::NoForegroundSubjectDetected);
    }

    #[test]
    fn value_error_with_fbx_only_message() {
      let category = guess_failure_category(
        Some(&WebhookErrorType::ValueError),
        Some(FBX_ONLY_MESSAGE),
      );
      assert_eq!(category, FrontendFailureCategory::FormatNotSupported);
    }

    #[test]
    fn input_value_error_with_fbx_only_message() {
      // Both generic validation error types share the message classifier.
      let category = guess_failure_category(
        Some(&WebhookErrorType::InputValueError),
        Some(FBX_ONLY_MESSAGE),
      );
      assert_eq!(category, FrontendFailureCategory::FormatNotSupported);
    }

    #[test]
    fn input_value_error_with_other_message() {
      let category = guess_failure_category(
        Some(&WebhookErrorType::InputValueError),
        Some("Field `num_gaussians` must be a positive integer."),
      );
      assert_eq!(category, FrontendFailureCategory::GenerationFailed);
    }

    #[test]
    fn value_error_with_other_message() {
      let category = guess_failure_category(
        Some(&WebhookErrorType::ValueError),
        Some("Input file could not be parsed."),
      );
      assert_eq!(category, FrontendFailureCategory::GenerationFailed);
    }

    #[test]
    fn input_value_error_without_message() {
      let category = guess_failure_category(Some(&WebhookErrorType::InputValueError), None);
      assert_eq!(category, FrontendFailureCategory::GenerationFailed);
    }

    #[test]
    fn content_policy_violation_ignores_message() {
      let category = guess_failure_category(
        Some(&WebhookErrorType::ContentPolicyViolation),
        Some(NO_FOREGROUND_SUBJECT_MESSAGE),
      );
      assert_eq!(category, FrontendFailureCategory::RuleBansUserContent);
    }

    #[test]
    fn no_error_type_defaults_to_generation_failed() {
      let category = guess_failure_category(None, Some(FBX_ONLY_MESSAGE));
      assert_eq!(category, FrontendFailureCategory::GenerationFailed);
    }
  }
}
