use serde_derive::{Deserialize, Serialize};
use crate::credentials::SoraCredentials;
use thiserror::Error;

const SORA_IMAGE_GEN_URL: &str = "https://sora.com/backend/video_gen";

/// This user agent is tied to the sentinel generation. If we need to change it, we may need to change sentinel generation too.
const USER_AGENT : &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

#[derive(Error, Debug)]
pub enum SoraError {
  #[error("Sora token expired: {0}")]
  TokenExpired(String),

  #[error("Sora sentinel block: {0}")]
  SentinelBlock(String),

  #[error("Sora API error: {0}")]
  GenericError(String),

  #[error("Network error: {0}")]
  NetworkError(String),
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (crate) enum VideoGenType {
  ImageGen,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (crate) enum OperationType {
  /// Simple prompt without reference images
  SimpleCompose,
  /// Prompt with reference images
  Remix,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (crate) enum InpaintItemType {
  Image,
}

#[derive(Serialize)]
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

#[derive(Serialize)]
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

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub (crate) struct RawSoraResponse {
  /// eg. "task_01jqsz9dsae9tvjygf1abrv3xf"
  pub id: String,
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
pub  enum SoraErrorCode {
  SentinelBlock,
  TokenExpired,

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
pub (crate) async fn image_gen_http_request(sora_request: RawSoraImageGenRequest, credentials: &SoraCredentials) -> Result<RawSoraResponse, SoraError> {
  let client = reqwest::Client::new();

  let sentinel = match credentials.sentinel.as_deref() {
    None => return Err(SoraError::GenericError("Calls to image gen require a sentinel in the credentials payload.".to_string())),
    Some(sentinel) => sentinel,
  };

  let http_request = client.post(SORA_IMAGE_GEN_URL)
      .header("User-Agent", USER_AGENT)
      .header("Cookie", &credentials.cookie)
      .header("Authorization", credentials.authorization_header_value())
      .header("Content-Type", "application/json")
      .header("OpenAI-Sentinel-Token", sentinel);

  let http_request = http_request.json(&sora_request).build()
      .map_err(|e| SoraError::NetworkError(e.to_string()))?;

  let response = client.execute(http_request)
      .await
      .map_err(|e| SoraError::NetworkError(e.to_string()))?;

  let status = response.status();

  let response_body = &response.text().await
      .map_err(|e| SoraError::NetworkError(e.to_string()))?;

  if status != reqwest::StatusCode::OK {
    let error_response: RawSoraErrorResponse = serde_json::from_str(response_body)
        .map_err(|e| SoraError::GenericError(format!("Failed to parse error response: {}", e)))?;

    // Check for specific error codes
    if let Some(code) = &error_response.error.code {
      match code {
        SoraErrorCode::TokenExpired => {
          return Err(SoraError::TokenExpired(error_response.error.message));
        }
        SoraErrorCode::SentinelBlock => {
          return Err(SoraError::SentinelBlock(error_response.error.message));
        }
        SoraErrorCode::Unknown(_) => {
          return Err(SoraError::GenericError(error_response.error.message));
        }
      }
    }

    return Err(SoraError::GenericError(error_response.error.message));
  }

  let response = serde_json::from_str(response_body)
      .map_err(|e| SoraError::GenericError(format!("Failed to parse success response: {}", e)))?;

  Ok(response)
}
