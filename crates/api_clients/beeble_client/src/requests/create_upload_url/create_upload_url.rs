use log::info;

use crate::creds::beeble_api_key::BeebleApiKey;
use crate::error::beeble_client_error::BeebleClientError;
use crate::error::beeble_error::BeebleError;
use crate::error::beeble_generic_api_error::BeebleGenericApiError;
use crate::error::beeble_specific_api_error::BeebleSpecificApiError;
use crate::requests::create_upload_url::request_types::*;

const BEEBLE_API_BASE_URL: &str = "https://api.beeble.ai/v1";

// ── Public args ──

pub struct CreateUploadUrlArgs {
  pub api_key: BeebleApiKey,
  pub filename: String,
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct CreateUploadUrlSuccess {
  /// Upload ID (upload_...).
  pub id: String,
  /// Presigned PUT URL for uploading. Expires after 1 hour.
  pub upload_url: String,
  /// beeble:// URI to reference this upload in generation calls.
  pub beeble_uri: String,
}

// ── Implementation ──

/// Create a presigned upload URL for a media file.
///
/// After receiving the URL, PUT your file bytes directly to `upload_url`.
/// Then use `beeble_uri` as the source_uri, reference_image_uri, or alpha_uri
/// in generation calls.
pub async fn create_upload_url(args: CreateUploadUrlArgs) -> Result<CreateUploadUrlSuccess, BeebleError> {
  let url = format!("{}/uploads", BEEBLE_API_BASE_URL);

  info!("Creating Beeble upload URL for filename: {}", args.filename);

  let request_body = CreateUploadUrlRequestBody {
    filename: args.filename,
  };

  let client = reqwest::Client::builder()
    .build()
    .map_err(|err| BeebleClientError::ReqwestClientError(err))?;

  let response = client.post(&url)
    .header("x-api-key", &args.api_key.api_key)
    .header("Content-Type", "application/json")
    .json(&request_body)
    .send()
    .await
    .map_err(|err| BeebleGenericApiError::ReqwestError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| BeebleGenericApiError::ReqwestError(err))?;

  info!("Beeble create upload URL response: status={}", status);

  if status == reqwest::StatusCode::UNAUTHORIZED {
    return Err(BeebleSpecificApiError::Unauthorized.into());
  }

  if !status.is_success() {
    return Err(BeebleGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let parsed: CreateUploadUrlResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| BeebleGenericApiError::SerdeResponseParseError(err, response_body.clone()))?;

  Ok(CreateUploadUrlSuccess {
    id: parsed.id,
    upload_url: parsed.upload_url,
    beeble_uri: parsed.beeble_uri,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use errors::AnyhowResult;

  #[test]
  fn request_body_serializes() {
    let body = CreateUploadUrlRequestBody {
      filename: "test_video.mp4".to_string(),
    };
    let json = serde_json::to_string(&body).unwrap();
    assert!(json.contains("test_video.mp4"));
  }

  #[test]
  fn response_body_deserializes() {
    let json = r#"{"id":"upload_abc123","upload_url":"https://example.com/put","beeble_uri":"beeble://upload_abc123/video.mp4"}"#;
    let parsed: CreateUploadUrlResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.id, "upload_abc123");
    assert_eq!(parsed.beeble_uri, "beeble://upload_abc123/video.mp4");
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn test_create_upload_url() -> AnyhowResult<()> {
    let api_key = get_test_api_key()?;
    let result = create_upload_url(CreateUploadUrlArgs {
      api_key,
      filename: "test_image.png".to_string(),
    }).await?;

    println!("Upload ID: {}", result.id);
    println!("Upload URL: {}", result.upload_url);
    println!("Beeble URI: {}", result.beeble_uri);
    assert!(result.id.starts_with("upload_"));
    assert!(result.beeble_uri.starts_with("beeble://"));
    Ok(())
  }
}
