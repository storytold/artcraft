use log::info;
use serde_derive::Serialize;

use crate::api::requests::files::delete_file::request_types::*;
use crate::api::requests::xai_host::XAI_API_BASE_URL;
use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;

// ── Public args ──

/// Top-level argument to [`delete_file`]. Borrows the API key separately from
/// the request body so callers can log/save [`DeleteFileRequest`] without
/// leaking the credential.
#[derive(Clone, Debug)]
pub struct DeleteFileArgs<'a> {
  pub api_key: &'a GrokApiKey,
  pub request: DeleteFileRequest,
}

/// The material part of a delete-file request. Derives [`Serialize`].
#[derive(Clone, Debug, Serialize)]
pub struct DeleteFileRequest {
  pub file_id: String,
}

// ── Public response ──

#[derive(Debug, Clone)]
pub struct DeleteFileSuccess {
  pub file_id: Option<String>,
  /// Should be `true` after a successful delete.
  pub deleted: bool,
}

// ── Implementation ──

/// DELETE https://api.x.ai/v1/files/{file_id} — delete a previously-uploaded
/// file. After deletion the `file_id` becomes invalid and cannot be
/// referenced in further requests.
///
/// Docs: <https://docs.x.ai/developers/rest-api-reference/files/manage>
pub async fn delete_file(args: DeleteFileArgs<'_>) -> Result<DeleteFileSuccess, GrokError> {
  let req = args.request;
  let url = format!("{}/v1/files/{}", XAI_API_BASE_URL, req.file_id);

  info!("Grok delete_file: file_id={}", req.file_id);

  let client = reqwest::Client::builder()
    .build()
    .map_err(GrokClientError::ReqwestClientError)?;

  let bearer = format!("Bearer {}", args.api_key.api_key);

  let response = client.delete(&url)
    .header("Authorization", bearer)
    .send()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(GrokGenericApiError::ReqwestError)?;

  info!("Grok delete_file response: status={}", status);

  classify_grok_http_error(status, Some(&response_body))?;

  let parsed: DeleteFileResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  Ok(DeleteFileSuccess {
    file_id: parsed.id,
    deleted: parsed.deleted.unwrap_or(false),
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn response_body_deserializes_success() {
    // serde drops the `object` field on parse; only `id` and `deleted` are
    // load-bearing for our DTO.
    let json = r#"{ "id": "file_abc", "object": "file", "deleted": true }"#;
    let parsed: DeleteFileResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.id.as_deref(), Some("file_abc"));
    assert_eq!(parsed.deleted, Some(true));
  }

  #[test]
  fn response_body_deserializes_minimal() {
    // xAI may omit some fields; only `deleted` is load-bearing.
    let json = r#"{ "deleted": true }"#;
    let parsed: DeleteFileResponseBody = serde_json::from_str(json).unwrap();
    assert_eq!(parsed.deleted, Some(true));
    assert!(parsed.id.is_none());
  }

  #[test]
  fn request_serializes_without_api_key() {
    let key = GrokApiKey::new("secret_must_not_leak".to_string());
    let args = DeleteFileArgs {
      api_key: &key,
      request: DeleteFileRequest { file_id: "file_abc".to_string() },
    };
    let json = serde_json::to_string(&args.request).unwrap();
    assert!(!json.contains("secret_must_not_leak"));
    assert!(json.contains("\"file_id\":\"file_abc\""));
  }
}
