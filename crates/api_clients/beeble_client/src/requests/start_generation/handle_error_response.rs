use reqwest::StatusCode;

use crate::error::beeble_error::BeebleError;
use crate::error::beeble_generic_api_error::BeebleGenericApiError;
use crate::error::beeble_specific_api_error::BeebleSpecificApiError;

/// Additional context for error handling that depends on the original request.
pub struct ErrorContext <'a> {
  pub maybe_callback_url: Option<&'a str>,
}

/// Classify a non-success Beeble API response into the appropriate error.
///
/// Only call this when `!status.is_success()`. Always returns `Err`.
pub fn handle_error_response<T>(
  status: StatusCode,
  response_body: &str,
  context: &ErrorContext,
) -> Result<T, BeebleError> {
  match status.as_u16() {
    401 => Err(BeebleSpecificApiError::Unauthorized.into()),
    402 => Err(BeebleSpecificApiError::InsufficientCredits.into()),
    400 if response_body.contains("INVALID_CALLBACK_URL") => {
      let message = extract_error_message(response_body)
        .unwrap_or_else(|| "callback_url must be a valid, publicly-reachable HTTPS URL".to_string());
      Err(BeebleSpecificApiError::BadWebhookUrl {
        message,
        webhook_url: context.maybe_callback_url.unwrap_or_default().to_string(),
      }.into())
    }
    400 if response_body.contains("VIDEO_TOO_MANY_FRAMES") => {
      let message = extract_error_message(response_body)
        .unwrap_or_else(|| "Video has too many frames".to_string());
      let (detected, max) = extract_frame_counts(&message);
      Err(BeebleSpecificApiError::VideoHasTooManyFrames {
        max_frames: max,
        detected_frames: detected,
        message,
      }.into())
    }
    409 => Err(BeebleSpecificApiError::IdempotencyConflict.into()),
    429 => Err(BeebleSpecificApiError::RateLimited.into()),
    _ => {
      Err(BeebleGenericApiError::UncategorizedBadResponseWithStatusAndBody {
        status_code: status,
        body: response_body.to_string(),
      }.into())
    }
  }
}

/// Try to extract the "message" field from a Beeble error response body.
/// Beeble errors look like: `{"error":{"message":"...","code":"..."}}`
fn extract_error_message(body: &str) -> Option<String> {
  let parsed: serde_json::Value = serde_json::from_str(body).ok()?;
  parsed.get("error")?.get("message")?.as_str().map(|s| s.to_string())
}

/// Parse frame counts from a message like "Video has 419 frames, which exceeds the maximum of 240."
fn extract_frame_counts(message: &str) -> (u64, u64) {
  let numbers: Vec<u64> = message
    .split(|c: char| !c.is_ascii_digit())
    .filter(|s| !s.is_empty())
    .filter_map(|s| s.parse().ok())
    .collect();

  match numbers.as_slice() {
    [detected, max, ..] => (*detected, *max),
    [detected] => (*detected, 0),
    _ => (0, 0),
  }
}
