use log::warn;
use serde::Deserialize;

use crate::creds::gmicloud_api_key::GmiCloudApiKey;
use crate::error::gmicloud_error::GmiCloudError;
use crate::error::gmicloud_generic_api_error::GmiCloudGenericApiError;
use crate::error::gmicloud_specific_api_error::GmiCloudSpecificApiError;

const BASE_URL: &str = "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey";

/// The response from `GET /requests/{request_id}`.
#[derive(Debug, Deserialize)]
pub struct GmiCloudPollResponse {
  pub request_id: String,
  pub model: String,
  pub status: String,
  pub outcome: Option<GmiCloudOutcome>,
}

/// The outcome of a completed request.
#[derive(Debug, Deserialize)]
pub struct GmiCloudOutcome {
  pub video_url: Option<String>,
  pub thumbnail_image_url: Option<String>,
}

/// Poll the status of a GmiCloud request.
pub async fn poll_gmicloud_request(
  api_key: &GmiCloudApiKey,
  request_id: &str,
) -> Result<GmiCloudPollResponse, GmiCloudError> {
  let url = format!("{}/requests/{}", BASE_URL, request_id);

  let client = reqwest::Client::new();
  let response = client
    .get(&url)
    .header("Authorization", format!("Bearer {}", api_key.as_str()))
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
    warn!("GmiCloud poll error: status={}, body={}", status, body_text);
    return Err(GmiCloudGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status.as_u16(),
      body: body_text,
    }.into());
  }

  let parsed: GmiCloudPollResponse = serde_json::from_str(&body_text)
    .map_err(|err| GmiCloudGenericApiError::SerdeResponseParseErrorWithBody(err, body_text))?;

  Ok(parsed)
}
