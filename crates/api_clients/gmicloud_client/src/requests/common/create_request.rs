use std::time::Duration;

use log::warn;
use serde::{Deserialize, Serialize};

use crate::creds::gmicloud_api_key::GmiCloudApiKey;
use crate::error::gmicloud_error::GmiCloudError;
use crate::error::gmicloud_generic_api_error::GmiCloudGenericApiError;
use crate::error::gmicloud_specific_api_error::GmiCloudSpecificApiError;
use crate::requests::context::request_context::RequestContext;

const BASE_URL: &str = "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey";

/// Default request timeout. Video requests return quickly (async queue),
/// but image requests block until completion and can take 60+ seconds.
const DEFAULT_TIMEOUT: Duration = Duration::from_secs(180);

/// The top-level request body sent to `POST /requests`.
#[derive(Debug, Serialize)]
pub struct GmiCloudCreateRequest<P: Serialize> {
  pub model: String,
  pub payload: P,
}

/// The response from `POST /requests`.
#[derive(Debug, Deserialize)]
pub struct GmiCloudCreateResponse {
  pub request_id: String,
  pub model: String,
  pub status: String,
}

/// Submit a request to GmiCloud using just an API key (default timeout).
pub async fn create_gmicloud_request<P: Serialize>(
  api_key: &GmiCloudApiKey,
  body: &GmiCloudCreateRequest<P>,
) -> Result<GmiCloudCreateResponse, GmiCloudError> {
  let context = RequestContext {
    api_key,
    maybe_timeout: None,
  };
  create_gmicloud_request_with_context(&context, body).await
}

/// Submit a request to GmiCloud with explicit context (custom timeout, etc.).
pub async fn create_gmicloud_request_with_context<P: Serialize>(
  context: &RequestContext<'_>,
  body: &GmiCloudCreateRequest<P>,
) -> Result<GmiCloudCreateResponse, GmiCloudError> {
  let url = format!("{}/requests", BASE_URL);
  let timeout = context.maybe_timeout.unwrap_or(DEFAULT_TIMEOUT);

  let client = reqwest::Client::builder()
    .timeout(timeout)
    .build()
    .map_err(GmiCloudGenericApiError::from)?;

  let response = client
    .post(&url)
    .header("Authorization", format!("Bearer {}", context.api_key.as_str()))
    .json(body)
    .send()
    .await
    .map_err(GmiCloudGenericApiError::from)?;

  let status = response.status();
  let body_text = response.text().await
    .map_err(GmiCloudGenericApiError::from)?;

  if status == reqwest::StatusCode::UNAUTHORIZED {
    return Err(GmiCloudSpecificApiError::Unauthorized.into());
  }

  if !status.is_success() {
    warn!("GmiCloud API error: status={}, body={}", status, body_text);

    // Detect specific error codes embedded in the response body.
    if let Some(specific) = classify_error_body(&body_text) {
      return Err(specific.into());
    }

    return Err(GmiCloudGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status.as_u16(),
      body: body_text,
    }.into());
  }

  let parsed: GmiCloudCreateResponse = serde_json::from_str(&body_text)
    .map_err(|err| GmiCloudGenericApiError::SerdeResponseParseErrorWithBody(err, body_text))?;

  Ok(parsed)
}

/// Attempt to classify an error response body into a specific error type.
/// GmiCloud sometimes wraps inner API errors as a JSON string within `{"error": "..."}`.
fn classify_error_body(body: &str) -> Option<GmiCloudSpecificApiError> {
  if body.contains("InputImageSensitiveContentDetected") {
    let message = extract_inner_message(body)
      .unwrap_or_else(|| "Input image may contain a real person".to_string());
    return Some(GmiCloudSpecificApiError::ContentContainsRealPerson(message));
  }
  None
}

/// Extract the inner `message` field from a doubly-encoded GmiCloud error response.
/// Expected shape: `{"error":"API request failed with status 400: {\"error\":{\"message\":\"...\"}}"}`
fn extract_inner_message(body: &str) -> Option<String> {
  let outer: serde_json::Value = serde_json::from_str(body).ok()?;
  let error_str = outer.get("error")?.as_str()?;

  // The inner JSON is embedded after "status NNN: "
  let inner_json_start = error_str.find('{')?;
  let inner_str = &error_str[inner_json_start..];
  let inner: serde_json::Value = serde_json::from_str(inner_str).ok()?;

  inner.get("error")?.get("message")?.as_str().map(|s| s.to_string())
}
