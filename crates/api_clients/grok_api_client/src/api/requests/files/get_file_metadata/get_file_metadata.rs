use log::info;
use serde_derive::Serialize;

use crate::api::requests::files::get_file_metadata::request_types::*;
use crate::api::requests::xai_host::XAI_API_BASE_URL;
use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;

// ── Public args ──

/// Top-level argument to [`get_file_metadata`]. Borrows the API key separately
/// from the request body so callers can log/save [`GetFileMetadataRequest`]
/// without leaking the credential.
#[derive(Clone, Debug)]
pub struct GetFileMetadataArgs<'a> {
  pub api_key: &'a GrokApiKey,
  pub request: GetFileMetadataRequest,
}

/// The material part of a get-file-metadata request. Derives [`Serialize`].
#[derive(Clone, Debug, Serialize)]
pub struct GetFileMetadataRequest {
  pub file_id: String,
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct FileMetadata {
  pub file_id: String,
  pub bytes: Option<u64>,
  pub created_at: Option<i64>,
  pub expires_at: Option<i64>,
  pub filename: Option<String>,
  pub purpose: Option<String>,
}

// ── Implementation ──

/// GET https://api.x.ai/v1/files/{file_id} — fetch metadata for an uploaded
/// file (no content; use `download_file` for that).
///
/// Docs: <https://docs.x.ai/developers/rest-api-reference/files/manage>
pub async fn get_file_metadata(args: GetFileMetadataArgs<'_>) -> Result<FileMetadata, GrokError> {
  let req = args.request;
  let url = format!("{}/v1/files/{}", XAI_API_BASE_URL, req.file_id);

  info!("Grok get_file_metadata: file_id={}", req.file_id);

  let client = reqwest::Client::builder()
    .build()
    .map_err(GrokClientError::ReqwestClientError)?;

  let bearer = format!("Bearer {}", args.api_key.api_key);

  let response = client.get(&url)
    .header("Authorization", bearer)
    .send()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  info!("Grok get_file_metadata response: status={}", status);

  classify_grok_http_error(status, Some(&response_body))?;

  let parsed: FileMetadataResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  Ok(FileMetadata {
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

  #[test]
  fn response_body_deserializes() {
    let json = r#"{
      "id": "file_abc123",
      "object": "file",
      "bytes": 4096,
      "created_at": 1716489600,
      "expires_at": 1719081600,
      "filename": "photo.png",
      "purpose": "vision"
    }"#;
    let parsed: FileMetadataResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.id, "file_abc123");
    assert_eq!(parsed.expires_at, Some(1719081600));
  }

  #[test]
  fn request_serializes_without_api_key() {
    let key = GrokApiKey::new("secret_must_not_leak".to_string());
    let args = GetFileMetadataArgs {
      api_key: &key,
      request: GetFileMetadataRequest { file_id: "file_abc".to_string() },
    };
    let json = serde_json::to_string(&args.request).unwrap();
    assert!(!json.contains("secret_must_not_leak"));
    assert!(json.contains("\"file_id\":\"file_abc\""));
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key + valid file_id
  async fn live_test_unknown_file_returns_not_found() -> AnyhowResult<()> {
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use crate::test_utils::setup_test_logging::setup_test_logging;
    setup_test_logging();

    let api_key = get_test_api_key()?;
    let result = get_file_metadata(GetFileMetadataArgs {
      api_key: &api_key,
      request: GetFileMetadataRequest {
        file_id: "file_doesnotexist000000".to_string(),
      },
    }).await;
    let err = result.unwrap_err();
    assert!(matches!(err, GrokError::ApiSpecific(GrokSpecificApiError::NotFound)),
      "expected NotFound, got: {:?}", err);
    Ok(())
  }
}
