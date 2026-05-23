use log::info;
use reqwest::multipart::{Form, Part};

use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::upload_file::request_types::*;
use crate::requests::xai_host::XAI_API_BASE_URL;

const MAX_FILE_BYTES: u64 = 50 * 1024 * 1024;

// ── Public args ──

#[derive(Clone, Debug)]
pub struct UploadFileArgs {
  pub api_key: GrokApiKey,

  /// Raw bytes of the file. xAI caps uploads at 50 MB.
  pub file_bytes: Vec<u8>,

  /// Original filename. xAI extracts this from the multipart
  /// `Content-Disposition: filename=...` header and surfaces it back in the
  /// response.
  pub filename: String,

  /// Optional MIME type. If `None`, reqwest uses `application/octet-stream`.
  pub maybe_content_type: Option<String>,

  /// Time-to-live in seconds (3600 – 2_592_000, i.e. 1 hour to 30 days). If
  /// `None`, the file persists indefinitely until explicitly deleted.
  pub expires_after_seconds: Option<u32>,

  /// OpenAI-compatibility label. xAI accepts but doesn't enforce this — set
  /// it if porting code that already uses OpenAI's Files API.
  pub purpose: Option<String>,
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct UploadFileSuccess {
  /// The xAI file identifier. Use this in the `FileId(_)` variant of
  /// [`crate::requests::image_edit::image_edit::ImageSource`],
  /// [`crate::requests::video_generation::video_generation::VideoImageSource`],
  /// [`crate::requests::video_edit::video_edit::VideoSource`], or
  /// [`crate::requests::video_extension::video_extension::VideoExtensionSource`].
  pub file_id: String,

  pub bytes: Option<u64>,
  pub created_at: Option<i64>,
  pub expires_at: Option<i64>,
  pub filename: Option<String>,
  pub purpose: Option<String>,
}

// ── Implementation ──

/// POST https://api.x.ai/v1/files — upload a file and receive a `file_id`
/// you can reference in subsequent image/video edit, generation, or
/// extension calls.
///
/// xAI documentation:
/// - <https://docs.x.ai/developers/rest-api-reference/files/upload>
pub async fn upload_file(args: UploadFileArgs) -> Result<UploadFileSuccess, GrokError> {
  if args.file_bytes.is_empty() {
    return Err(crate::error::grok_specific_api_error::GrokSpecificApiError::BadRequest(
      "upload_file: file_bytes is empty".to_string(),
    ).into());
  }
  if args.file_bytes.len() as u64 > MAX_FILE_BYTES {
    return Err(crate::error::grok_specific_api_error::GrokSpecificApiError::BadRequest(
      format!("upload_file: file_bytes is {} bytes, exceeds xAI's 50 MB limit", args.file_bytes.len()),
    ).into());
  }

  let url = format!("{}/v1/files", XAI_API_BASE_URL);

  info!(
    "Grok upload_file: filename={}, bytes={}, expires_after={:?}, purpose={:?}",
    args.filename, args.file_bytes.len(), args.expires_after_seconds, args.purpose
  );

  let mut file_part = Part::bytes(args.file_bytes).file_name(args.filename.clone());
  if let Some(ct) = args.maybe_content_type.as_deref() {
    file_part = file_part.mime_str(ct)
      .map_err(GrokClientError::ReqwestClientError)?;
  }

  let mut form = Form::new().part("file", file_part);
  if let Some(secs) = args.expires_after_seconds {
    form = form.text("expires_after", secs.to_string());
  }
  if let Some(purpose) = args.purpose {
    form = form.text("purpose", purpose);
  }

  let client = reqwest::Client::builder()
    .build()
    .map_err(GrokClientError::ReqwestClientError)?;

  let bearer = format!("Bearer {}", args.api_key.api_key);

  let response = client.post(&url)
    .header("Authorization", bearer)
    .multipart(form)
    .send()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  info!("Grok upload_file response: status={}", status);

  classify_grok_http_error(status, Some(&response_body))?;

  let parsed: UploadFileResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  Ok(UploadFileSuccess {
    file_id: parsed.id,
    bytes: parsed.bytes,
    created_at: parsed.created_at,
    expires_at: parsed.expires_at,
    filename: parsed.filename,
    purpose: parsed.purpose,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use errors::AnyhowResult;

  use crate::error::grok_specific_api_error::GrokSpecificApiError;

  // ── Client-side validation ──

  #[tokio::test]
  async fn empty_bytes_returns_bad_request() {
    let result = upload_file(UploadFileArgs {
      api_key: GrokApiKey::new("dummy".to_string()),
      file_bytes: vec![],
      filename: "x.png".to_string(),
      maybe_content_type: None,
      expires_after_seconds: None,
      purpose: None,
    }).await;
    let err = result.unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::BadRequest(_))));
  }

  #[tokio::test]
  async fn over_size_limit_returns_bad_request() {
    let oversized: Vec<u8> = vec![0u8; (MAX_FILE_BYTES + 1) as usize];
    let result = upload_file(UploadFileArgs {
      api_key: GrokApiKey::new("dummy".to_string()),
      file_bytes: oversized,
      filename: "x.png".to_string(),
      maybe_content_type: None,
      expires_after_seconds: None,
      purpose: None,
    }).await;
    let err = result.unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::BadRequest(_))));
  }

  // ── Response parsing ──

  #[test]
  fn response_body_deserializes() {
    let json = r#"{
      "id": "file_abc123",
      "object": "file",
      "bytes": 1024,
      "created_at": 1716489600,
      "expires_at": null,
      "filename": "photo.png",
      "purpose": "vision"
    }"#;
    let parsed: UploadFileResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.id, "file_abc123");
    assert_eq!(parsed.bytes, Some(1024));
    assert_eq!(parsed.filename.as_deref(), Some("photo.png"));
  }

  // ── Live API tests ──

  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn live_test_upload_small_png() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    // 1x1 transparent PNG
    let png_bytes: Vec<u8> = vec![
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82,
    ];

    let result = upload_file(UploadFileArgs {
      api_key: get_test_api_key()?,
      file_bytes: png_bytes,
      filename: "test_1x1.png".to_string(),
      maybe_content_type: Some("image/png".to_string()),
      expires_after_seconds: Some(3600),
      purpose: None,
    }).await.map_err(|e| anyhow::anyhow!("{}", e))?;

    println!("Uploaded file_id={}, bytes={:?}", result.file_id, result.bytes);
    assert!(!result.file_id.is_empty());
    Ok(())
  }
}
