use super::request::GenerateSentinelRefreshRequest;
use crate::constants::user_agent::CLIENT_USER_AGENT;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::utils_internal::classify_general_http_error::classify_general_http_error;
use errors::AnyhowResult;
use uuid_utils::uuid::generate_random_uuid;
use log::error;
use serde_derive::{Deserialize, Serialize};
use thiserror::Error;
use wreq::Client;

const SORA_IMAGE_GEN_URL: &str = "https://chatgpt.com/backend-api/sentinel/req";

const SENTINEL_FLOW: &str = "sora_create_task";


#[derive(Debug, Serialize, Deserialize)]
pub struct SentinelRequest {
  #[serde(rename = "p")]
  problem: String,

  #[serde(rename = "id")]
  id: String,

  #[serde(rename = "flow")]
  flow: String,
}


impl SentinelRequest {
  pub fn new(problem: String) -> Self {
    let id = generate_random_uuid();
    Self { problem, id, flow: SENTINEL_FLOW.to_string() }
  }
}


#[derive(Debug, Serialize, Deserialize)]
pub struct SentinelResponse {
  persona: String,
  token: String,
}


/// Note: This looks like an incomplete implementation of the original Python implementation.
/// Curiously, it worked with Sora 1.0 (and continues to work), but it fails for Sora 2.0 while the
/// unchanged Python implementation works. We'll be deprecating this.
#[deprecated(note="use new sentinel token flow")]
pub async fn generate_sentinel_token() -> Result<String, SoraError> {
  let (_request, base64_request) = GenerateSentinelRefreshRequest::new().with_fourth_and_tenth();
  let request = SentinelRequest::new(base64_request);
  let client = Client::new();
  let response = client.post(SORA_IMAGE_GEN_URL)
      .header("User-Agent", CLIENT_USER_AGENT)
      .header("Content-Type", "application/json")
      .json(&request)
      .send()
      .await
      .map_err(|err| {
        error!("Client failed to generate sentinel token: {:?}", err);
        SoraGenericApiError::WreqError(err)
      })?;
  
  if !response.status().is_success() {
    error!("Failed to generate sentinel: {}", response.status());
    let error = classify_general_http_error(response).await;
    return Err(error);
  }

  let text_body = &response.text().await
      .map_err(|err| {
        error!("sora error reading sentinel token text body: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let response = serde_json::from_str::<SentinelResponse>(&text_body)
      .map_err(|err| {
        error!("Failed to parse media list response: {}", err);
        SoraGenericApiError::SerdeResponseParseErrorWithBody(err, text_body.to_string())
      })?;

  Ok(response.token)
}


#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  #[ignore] // Only manually trigger this
  async fn test_generate_token() {
    let token = generate_sentinel_token().await.unwrap();
    println!("{}", token);
  }
}