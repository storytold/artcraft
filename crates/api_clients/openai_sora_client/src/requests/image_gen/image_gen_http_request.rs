use crate::constants::user_agent::CLIENT_USER_AGENT;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::error::sora_specific_api_error::SoraSpecificApiError;
use crate::requests::common::task_id::TaskId;
use log::{error, warn};
use serde_derive::{Deserialize, Serialize};
use std::io::Write;
use std::time::Duration;
use thiserror::Error;
use wreq::{Client, StatusCode};

const SORA_IMAGE_GEN_URL: &str = "https://sora.com/backend/video_gen";

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) enum VideoGenType {
  ImageGen,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) enum OperationType {
  /// Simple prompt without reference images
  SimpleCompose,
  /// Prompt with reference images
  Remix,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) enum InpaintItemType {
  Image,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) struct InpaintItem {
  pub r#type: InpaintItemType,
  /// Typically "0"
  pub frame_index: u32,
  /// Unknown field; defaults to null
  pub preset_id: Option<String>,
  /// Unknown field; defaults to null
  pub generation_id: Option<String>,
  /// Token identifier of the item, eg. "media_01jqt9vt20erx9zvryf3v1pecx"
  pub upload_media_id: String,
  /// Typically "0"
  pub source_start_frame: u32,
  /// Typically "0"
  pub source_end_frame: u32,
  /// Unknown field; defaults to null
  pub crop_bounds: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) struct RawSoraImageGenRequest {
  /// eg. "image_gen"
  pub r#type: VideoGenType,
  /// eg. "simple_compose"
  pub operation: OperationType,
  /// The user's raw prompt
  pub prompt: String,
  /// The number of variants to generate, eg. 2
  pub n_variants: usize,
  /// The width of the image, eg. 480
  pub width: u16,
  /// The height of the image, eg. 480
  pub height: u16,
  /// The number of frames to generate, eg. 1
  pub n_frames: u8,
  /// The items to inpaint, eg. []
  pub inpaint_items: Vec<InpaintItem>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
pub (crate) struct RawSoraResponse {
  /// eg. "task_01jqsz9dsae9tvjygf1abrv3xf"
  pub id: TaskId,
  /// not known
  pub priority: Option<String>,
}

// https://sora.com/backend/notif?limit=100&before=task_01jqpg8qghenet0rw2a79p0vbn
// error
// message	"Missing bearer authentication in header"
// type	"invalid_request_error"
// param	null
// code	null
#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub struct RawSoraErrorResponse {
  error: RawSoraErrorInner,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum RawSoraError {
  Error(RawSoraErrorInner),
  Unknown(String),
}


#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum SoraErrorCode {
  SentinelBlock,
  InvalidJwt,
  TokenExpired,
  TooManyConcurrentTasks,
  UsernameRequired,
  Unknown(String),
}


#[derive(Deserialize, Debug, Clone, Error)]
#[serde(rename_all = "snake_case")]
pub struct RawSoraErrorInner {
  message: String,
  r#type: String,
  param: Option<String>,
  code: Option<SoraErrorCode>,
}

impl std::fmt::Display for RawSoraErrorInner {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "Sora API error: {}", self.message)
  }
}

/// Don't expose the internal request implementation as there are only a few "correct" ways to call the API.
pub (crate) async fn image_gen_http_request(
  sora_request: RawSoraImageGenRequest, 
  credentials: &SoraCredentialSet,
  request_timeout: Option<Duration>,
) -> Result<RawSoraResponse, SoraError> {
  let client = Client::new();

  let cookie = credentials.cookies.to_string();

  let authorization_header = credentials.jwt_bearer_token.as_ref()
      .ok_or(SoraClientError::NoBearerTokenForRequest)?
      .to_authorization_header_value();

  let sentinel = credentials.sora_sentinel_token.as_ref()
      .map(|sentinel| sentinel.to_request_header_json())
      .transpose()?
      .ok_or(SoraClientError::NoSentinelTokenForRequest)?;

  //let sentinel = credentials.sora_sentinel.as_ref()
  //    .map(|sentinel| sentinel.get_sentinel().to_string())
  //    .ok_or(SoraClientError::NoSentinelTokenForRequest)?;

  let mut http_request = client.post(SORA_IMAGE_GEN_URL)
      .header("User-Agent", CLIENT_USER_AGENT)
      .header("Cookie", &cookie)
      .header("Authorization", &authorization_header)
      .header("Content-Type", "application/json")
      .header("OpenAI-Sentinel-Token", &sentinel);

  if let Some(timeout) = request_timeout {
    http_request = http_request.timeout(timeout);
  }

  let http_request = http_request.json(&sora_request).build()
      .map_err(|err| {
        error!("Error building Sora image generation HTTP request: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| {
        error!("Error during Sora image generation request: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  let status = response.status();

  let response_body = &response.text().await
      .map_err(|err| {
        error!("Error reading Sora image generation response body: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  if status != StatusCode::OK {
    warn!("Sora image generation failure. Raw response: {:?}", response_body);
    
    let error_response: RawSoraErrorResponse = serde_json::from_str(response_body)
        .map_err(|err| SoraGenericApiError::SerdeParseErrorWithBodyOnNon200(err, response_body.to_string()))?;

    // Check for specific error codes
    if let Some(code) = &error_response.error.code {
      match code {
        SoraErrorCode::TokenExpired => {
          error!("Sora token expired: {}", error_response.error);
          return Err(SoraSpecificApiError::TokenExpiredError.into());
        }
        SoraErrorCode::SentinelBlock => {
          error!("Sora image generation error sentinel block: {}", error_response.error);
          return Err(SoraSpecificApiError::SentinelBlockError.into());
        }
        SoraErrorCode::TooManyConcurrentTasks => {
          error!("Too many concurrent tasks. Please wait.");
          return Err(SoraSpecificApiError::TooManyConcurrentTasks.into());
        }
        SoraErrorCode::Unknown(message) => {
          error!("Unknown error: {} - message: {}", error_response.error.message, message);
          return Err(SoraGenericApiError::UncategorizedBadResponse(error_response.error.message).into());
        }
        SoraErrorCode::InvalidJwt => {
          error!("Invalid JWT token: {}", error_response.error.message);
          return Err(SoraSpecificApiError::InvalidJwt.into());
        }
        SoraErrorCode::UsernameRequired => {
          error!("Username required: {}", error_response.error.message);
          return Err(SoraSpecificApiError::SoraUsernameNotYetCreated.into());
        }
      }
    }

    error!("Sora image generation failure: {}", error_response.error);
    return Err(SoraGenericApiError::UncategorizedBadResponse(
      format!("Unknown error code: {:?}, message: {:?}", error_response.error.code, error_response.error.message))
        .into());
  }

  let response = serde_json::from_str(response_body)
      .map_err(|err| SoraGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(response)
}

#[cfg(test)]
mod tests {
  use crate::requests::image_gen::image_gen_http_request::RawSoraResponse;
  use errors::AnyhowResult;

  #[test]
  #[ignore] // Run manually
  fn deserialize_task_id() -> AnyhowResult<()> {
    let json = "{\"id\": \"task_foobarbaz\"}";
    let response : RawSoraResponse = serde_json::from_str(json)?;
    assert_eq!(response.id.0, "task_foobarbaz");
    Ok(())
  }
}
