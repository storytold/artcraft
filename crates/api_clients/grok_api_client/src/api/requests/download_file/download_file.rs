use log::info;
use serde_derive::Serialize;

use crate::api::requests::xai_host::XAI_API_BASE_URL;
use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;

// ── Public args ──

/// Top-level argument to [`download_file`]. Borrows the API key separately
/// from the request body so callers can log/save [`DownloadFileRequest`]
/// without leaking the credential.
#[derive(Clone, Debug)]
pub struct DownloadFileArgs<'a> {
  pub api_key: &'a GrokApiKey,
  pub request: DownloadFileRequest,
}

/// The material part of a download-file request. Derives [`Serialize`].
#[derive(Clone, Debug, Serialize)]
pub struct DownloadFileRequest {
  pub file_id: String,

  /// Optional `?format=` query — `"original"` returns the bytes as uploaded;
  /// `"text"` returns a textual transcription where applicable. Omit for the
  /// xAI default.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub format: Option<DownloadFormat>,
}

#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum DownloadFormat {
  Original,
  Text,
}

impl DownloadFormat {
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::Original => "original",
      Self::Text => "text",
    }
  }
}

// Serialize as the wire string ("original" or "text").
impl serde::Serialize for DownloadFormat {
  fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_str(self.as_str())
  }
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct DownloadFileSuccess {
  /// Raw file content. The xAI response Content-Type is `application/octet-stream`.
  pub bytes: Vec<u8>,
}

// ── Implementation ──

/// GET https://api.x.ai/v1/files/{file_id}/content — download the raw bytes
/// of a previously-uploaded file.
///
/// Docs: <https://docs.x.ai/developers/rest-api-reference/files/download>
pub async fn download_file(args: DownloadFileArgs<'_>) -> Result<DownloadFileSuccess, GrokError> {
  let req = args.request;
  let mut url = format!("{}/v1/files/{}/content", XAI_API_BASE_URL, req.file_id);
  if let Some(fmt) = req.format {
    url.push_str("?format=");
    url.push_str(fmt.as_str());
  }

  info!("Grok download_file: file_id={}", req.file_id);

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

  // On error, read as text so the classifier can quote it back.
  if !status.is_success() {
    let body = response.text()
      .await
      .map_err(GrokGenericApiError::ReqwestError)?;
    classify_grok_http_error(status, Some(&body))?;
    // classify_grok_http_error always returns Err on non-success.
    unreachable!();
  }

  let bytes = response.bytes()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  info!("Grok download_file response: status={}, bytes={}", status, bytes.len());

  Ok(DownloadFileSuccess { bytes: bytes.to_vec() })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn download_format_serializes() {
    assert_eq!(DownloadFormat::Original.as_str(), "original");
    assert_eq!(DownloadFormat::Text.as_str(), "text");
  }

  #[test]
  fn download_format_serializes_as_plain_wire_string() {
    assert_eq!(serde_json::to_string(&DownloadFormat::Original).unwrap(), "\"original\"");
    assert_eq!(serde_json::to_string(&DownloadFormat::Text).unwrap(), "\"text\"");
  }

  #[test]
  fn request_serializes_without_api_key() {
    let key = GrokApiKey::new("secret_must_not_leak".to_string());
    let args = DownloadFileArgs {
      api_key: &key,
      request: DownloadFileRequest {
        file_id: "file_abc".to_string(),
        format: Some(DownloadFormat::Original),
      },
    };
    let json = serde_json::to_string(&args.request).unwrap();
    assert!(!json.contains("secret_must_not_leak"));
    assert!(json.contains("\"file_id\":\"file_abc\""));
    assert!(json.contains("\"format\":\"original\""));
  }
}
