use errors::AnyhowResult;
use serde_derive::{Deserialize, Serialize};
use thiserror::Error;
use idempotency::uuid::generate_random_uuid;

use super::request::GenerateSentinelRefreshRequest;

const SORA_IMAGE_GEN_URL: &str = "https://chatgpt.com/backend-api/sentinel/req";

/// This user agent is tied to the sentinel generation. If we need to change it, we may need to change sentinel generation too.
const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

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


pub async fn generate_token() -> AnyhowResult<String> {
  let (_request, base64_request) = GenerateSentinelRefreshRequest::new().with_fourth_and_tenth();
  let request = SentinelRequest::new(base64_request);
  let client = reqwest::Client::new();
  let response = client.post(SORA_IMAGE_GEN_URL)
    .header("User-Agent", USER_AGENT)
    .header("Content-Type", "application/json")
    .json(&request)
    .send()
    .await?;

  let response_json: SentinelResponse = response.json().await?;
  Ok(response_json.token)
}


#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_generate_token() {
    let token = generate_token().await.unwrap();
    println!("{}", token);
  }
}