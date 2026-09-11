use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::error::sora_specific_api_error::SoraSpecificApiError;
use crate::utils_internal::classify_general_http_error::classify_general_http_error;
use crate::utils_internal::classify_general_http_status_code_and_body::classify_general_http_status_code_and_body;
use errors::AnyhowResult;
use log::{debug, error, info};
use serde_derive::Deserialize;
use wreq::Client;

const SORA_BEARER_GENERATE_URL: &str = "https://sora.chatgpt.com/api/auth/session";

#[derive(Debug, Deserialize)]
pub struct SoraAuthResponse {
  pub user: SoraUser,
  pub expires: String,
  #[serde(rename = "accessToken")]
  pub access_token: String,
  #[serde(rename = "internalApiBase")]
  pub internal_api_base: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SoraUser {
  pub id: String,
  pub name: Option<String>,
  pub email: Option<String>,
  pub image: Option<String>,
  pub picture: Option<String>,
  pub provider: Option<String>,
  #[serde(rename = "lastAuthorizationCheck")]
  pub last_authorization_check: Option<i64>,
}

pub async fn generate_bearer_jwt_with_cookie(cookie: &str) -> Result<String, SoraError> {
  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| {
        error!("Error building the client: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  info!("Generating new JWT bearer token from session cookies... (cookie payload length: {})", cookie.len());

  let response = client.get(SORA_BEARER_GENERATE_URL)
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0")
      .header("Accept", "*/*")
      .header("Accept-Encoding", "gzip, deflate, br")
      .header("Accept-Language", "en-US,en;q=0.5")
      .header("Cookie", cookie)
      .send()
      .await
      .map_err(|err| {
        error!("Error sending request: {:?}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let status = response.status();

  let response_body = &response.text().await
      .map_err(|err| {
        error!("Error reading body while attempting to generate bearer token: {:?}", err);
        SoraGenericApiError::WreqError(err)
      })?;
  
  if !status.is_success() {
    error!("Failed to generate bearer token with session cookies: {} ; body = {}", status, response_body);
    let error = classify_general_http_status_code_and_body(status, &response_body);
    return Err(error);
  }
  
  debug!("Bearer token generation response was 200.");
  debug!("Auth Response: {}", response_body);
  
  if response_body == "null" {
    error!("Failed to generate bearer token. Response was the string `null`.");  
    return Err(SoraSpecificApiError::FailedToGenerateBearerToken.into()) 
  }
  
  let auth_response: SoraAuthResponse = serde_json::from_str(&response_body)
      .map_err(|err| {
        error!("Error parsing body while attempting to generate bearer token: {:?}", err);
        SoraGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string())
      })?;

  Ok(auth_response.access_token)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_credentials::get_test_credentials;

  const LOGGED_OUT_COOKIE :&str = "";
  const OLD_COOKIE : &str = "";

  mod success_case {
    use super::*;

    #[tokio::test]
    #[ignore] // Don't run in CI. Requires valid cookie
    async fn test_generate_bearer_with_cookie() {
      let creds = get_test_credentials().unwrap();

      let cookie = creds.cookies.as_str();

      let result = generate_bearer_jwt_with_cookie(cookie).await;

      assert!(result.is_ok());

      let bearer = result.unwrap();
      println!("Bearer token: {}", bearer);
    }
  }

  mod failure_cases {
    use super::*;

    #[tokio::test]
    #[ignore] // Don't run in CI. Requires valid cookie
    async fn logged_out_cookie_failure() {
      let result = generate_bearer_jwt_with_cookie(LOGGED_OUT_COOKIE).await;

      println!("Results: {:?}", result);

      assert!(result.is_ok());
      println!("Bearer token: {}", result.unwrap());
    }

    #[tokio::test]
    #[ignore] // Don't run in CI. Requires valid cookie
    async fn old_cookie_failure() {
      let result = generate_bearer_jwt_with_cookie(LOGGED_OUT_COOKIE).await;

      println!("Results: {:?}", result);

      assert!(result.is_ok());
      println!("Bearer token: {}", result.unwrap());
    }

    #[tokio::test]
    #[ignore] // Don't run in CI. Requires valid cookie
    async fn invalid_cookie_failure() {
      let result = generate_bearer_jwt_with_cookie("").await;

      println!("Results: {:?}", result);

      assert!(result.is_ok());
      println!("Bearer token: {}", result.unwrap());
    }
  }
}
