use crate::constants::user_agent::CLIENT_USER_AGENT;
use crate::creds::sora_sentinel_token::{RawSoraSentinelToken, SoraSentinelToken};
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::error::sora_specific_api_error::SoraSpecificApiError;
use crate::requests::auth_sentinel::request::GenerateSentinelRefreshRequest;
use crate::requests::auth_sentinel_2::extract_expiry::extract_expiry;
use crate::requests::auth_sentinel_2::request::SentinelRequest;
use crate::requests::auth_sentinel_2::response::SentinelResponse;
use crate::utils_internal::classify_general_http_error::classify_general_http_error;
use chrono::{DateTime, NaiveDateTime, TimeDelta, TimeZone, Utc};
use errors::AnyhowResult;
use uuid_utils::uuid::generate_random_uuid;
use log::{debug, error, info};
use serde_derive::{Deserialize, Serialize};
use std::io::Write;
use thiserror::Error;
use wreq::header::{ACCEPT, ACCEPT_LANGUAGE, AUTHORIZATION, CONTENT_TYPE, COOKIE, ORIGIN, REFERER, USER_AGENT};
use wreq::Client;

const SORA_SENTINEL_ENDPOINT: &str = "https://chatgpt.com/backend-api/sentinel/req";


/// This generates a Sentinel Token that works with Sora 1.0 and Sora 2.0 consumer products.
pub async fn generate_sentinel_token_2() -> Result<SoraSentinelToken, SoraError> {
  let (_request, base64_request) = GenerateSentinelRefreshRequest::new().with_fourth_and_tenth();

  let request = SentinelRequest::new(base64_request);
  let client = Client::new();

  let request_builder = client.post(SORA_SENTINEL_ENDPOINT)
      .header(USER_AGENT, CLIENT_USER_AGENT)
      .header(ACCEPT, "*/*")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.9")
      // TODO: Accept-Encoding
      // TODO: Cookie
      .header(REFERER, "https://chatgpt.com/backend-api/sentinel/frame.html")
      .header(CONTENT_TYPE, "application/json")
      .header(ORIGIN, "https://chatgpt.com")
      .header("sec-gpc", "1")
      .header("sec-fetch-dest", "empty")
      .header("sec-fetch-mode", "cors")
      .header("sec-fetch-site", "same-origin")
      .header("priority", "u=4")
      .header("te", "trailers");

  let response = request_builder
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

  debug!("Sentinel endpoint response body: {}", text_body);

  let response = serde_json::from_str::<SentinelResponse>(&text_body)
      .map_err(|err| {
        error!("Failed to parse sentinel token response: {}", err);
        SoraGenericApiError::SerdeResponseParseErrorWithBody(err, text_body.to_string())
      })?;

  let sentinel_token = into_sora_sentinel_token(request, response, text_body)?;

  Ok(sentinel_token)
}

fn into_sora_sentinel_token(request: SentinelRequest, response: SentinelResponse, raw_body: &str) -> Result<SoraSentinelToken, SoraSpecificApiError> {
  let expiry = extract_expiry(Utc::now(), &response);

  let maybe_token = response.token;

  let maybe_turnstile = response.turnstile
      .map(|turn| turn.dx)
      .flatten();

  let mut missing_token = false;
  let mut missing_turnstile = false;

  let (token, turnstile) = {
    let maybe_items = match (maybe_token, maybe_turnstile) {
      (Some(token), Some(turnstile)) => {
        Some((token, turnstile))
      }
      (None, None) => {
        missing_token = true;
        missing_turnstile = true;
        None
      }
      (None, Some(_turnstile)) => {
        missing_token = true;
        None
      }
      (Some(_token), None) => {
        missing_turnstile = true;
        None
      }
    };
    match maybe_items {
      Some((token, turnstile)) => (token, turnstile),
      _ => return Err(SoraSpecificApiError::SentinelResponseIsMissingFields {
        missing_token,
        missing_turnstile,
        raw_response: raw_body.to_string(),
      }),
    }
  };

  let sentinel_raw = RawSoraSentinelToken {
    p: request.p,
    id: request.id,
    flow: request.flow,
    t: turnstile,
    c: token,
  };


  let sentinel = SoraSentinelToken {
    token: sentinel_raw,
    browser_user_agent: CLIENT_USER_AGENT.to_string(),
    generated_at: expiry.generated_at,
    expires_in_seconds: expiry.expires_in_seconds,
  };

  Ok(sentinel)
}


#[cfg(test)]
mod tests {
  use super::*;
  use std::fs::write;

  #[tokio::test]
  #[ignore] // Only manually trigger this
  async fn test_generate_token_2() -> AnyhowResult<()> {
    let token = generate_sentinel_token_2().await?;
    println!("{:?}", token);
    assert_eq!(1, 2);
    Ok(())
  }

  #[tokio::test]
  #[ignore] // Only manually trigger this
  async fn write_token_to_disk() -> AnyhowResult<()> {
    let filename = "/Users/bt/Artcraft/credentials/sora_sentinel_token_store.json";
    let token = generate_sentinel_token_2().await?;

    let json = token.to_persistent_storage_json()?;

    write(filename, &json)?;

    assert_eq!(1, 2);
    Ok(())
  }
}
