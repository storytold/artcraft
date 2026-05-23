use log::info;

use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::xai_host::XAI_API_BASE_URL;

// ── Public args ──

#[derive(Clone, Debug)]
pub struct DownloadFileArgs {
  pub api_key: GrokApiKey,
  pub file_id: String,

  /// Optional `?format=` query — `"original"` returns the bytes as uploaded;
  /// `"text"` returns a textual transcription where applicable. Omit for the
  /// xAI default.
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
pub async fn download_file(args: DownloadFileArgs) -> Result<DownloadFileSuccess, GrokError> {
  let mut url = format!("{}/v1/files/{}/content", XAI_API_BASE_URL, args.file_id);
  if let Some(fmt) = args.format {
    url.push_str("?format=");
    url.push_str(fmt.as_str());
  }

  info!("Grok download_file: file_id={}", args.file_id);

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
}
