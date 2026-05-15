use log::warn;
use serde::{Deserialize, Serialize};

use crate::creds::gmicloud_api_key::GmiCloudApiKey;
use crate::error::gmicloud_error::GmiCloudError;
use crate::error::gmicloud_generic_api_error::GmiCloudGenericApiError;
use crate::error::gmicloud_specific_api_error::GmiCloudSpecificApiError;

const BASE_URL: &str = "https://console.gmicloud.ai/api/v1/ie/requestqueue/apikey";

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

/// Submit a video generation request to GmiCloud.
pub async fn create_gmicloud_request<P: Serialize>(
  api_key: &GmiCloudApiKey,
  body: &GmiCloudCreateRequest<P>,
) -> Result<GmiCloudCreateResponse, GmiCloudError> {
  let url = format!("{}/requests", BASE_URL);

  let client = reqwest::Client::new();
  let response = client
    .post(&url)
    .header("Authorization", format!("Bearer {}", api_key.as_str()))
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
    return Err(GmiCloudGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status.as_u16(),
      body: body_text,
    }.into());
  }

  let parsed: GmiCloudCreateResponse = serde_json::from_str(&body_text)
    .map_err(|err| GmiCloudGenericApiError::SerdeResponseParseErrorWithBody(err, body_text))?;

  Ok(parsed)
}
