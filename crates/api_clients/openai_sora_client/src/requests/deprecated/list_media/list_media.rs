use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::utils_internal::classify_general_http_error::classify_general_http_error;
use log::{error, info};
use once_cell::sync::Lazy;
use serde_derive::Deserialize;
use wreq::Client;

//const SORA_MEDIA_LIST_URL: &str = "https://sora.chatgpt.com/backend/video_gen?limit=50";
const SORA_MEDIA_LIST_URL : &str = "https://sora.chatgpt.com/backend/v2/list_tasks?limit=20";

#[derive(Debug, Deserialize)]
pub struct ListMediaResponse {
  pub task_responses: Vec<TaskResponse>,
  pub last_id: Option<String>,
  pub has_more: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct TaskResponse {
  /// Task id (eg. task_{foo})
  pub id: String,
  pub title: String,
  pub user: String,
  pub created_at: String,
  pub status: String,
  /// Text prompt that generated the image
  pub prompt: String,
  pub r#type: String,
  pub height: u32,
  pub width: u32,
  pub operation: String,
  
  // There are many more fields [...]
}

/// Note: this request only requires a valid bearer token, and it doesn't require a cookie payload at all!
pub async fn list_media(credentials: &SoraCredentialSet) -> Result<ListMediaResponse, SoraError> {
  let auth_header = credentials.jwt_bearer_token
      .as_ref()
      .map(|bearer| bearer.to_authorization_header_value())
      .ok_or_else(|| SoraClientError::NoBearerTokenForRequest)?;
  
  let cookie = credentials.cookies.to_string();

  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| {
        error!("Failed to build HTTP client: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let response = client.get(SORA_MEDIA_LIST_URL)
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0")
      .header("Accept", "*/*")
      .header("Accept-Encoding", "gzip, deflate, br")
      .header("Accept-Language", "en-US,en;q=0.5")
      .header("Cookie", &cookie)
      .header("Authorization", &auth_header)
      .send()
      .await
      .map_err(|err| {
        error!("Failed to fetch media list: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  if !response.status().is_success() {
    error!("Failed to fetch media list: {}", response.status());
    let error = classify_general_http_error(response).await;
    return Err(error);
  }

  info!("Successfully generated bearer token.");

  let text_body = &response.text().await
      .map_err(|err| {
        error!("sora error reading media list text body: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let response = serde_json::from_str::<ListMediaResponse>(text_body)
      .map_err(|err| {
        error!("Failed to parse media list response: {}", err);
        SoraGenericApiError::SerdeResponseParseErrorWithBody(err, text_body.to_string())
      })?;
  
  Ok(response)
}


#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Don't run in CI. Requires valid cookie
  async fn test_list_media() -> AnyhowResult<()> {
    let cookie = "";
    let bearer = "";

    let mut creds = SoraCredentialSet::initialize_with_just_cookies_str(cookie);
    creds.jwt_bearer_token = Some(SoraJwtBearerToken::new(bearer.to_string())?);
    
    let results = list_media(&creds).await.expect("should work");
    
    println!("{:?}", results);
    
    assert!(results.task_responses.len() > 0);
    
    Ok(())
  }
}
