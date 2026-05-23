use log::info;

use crate::creds::grok_api_key::GrokApiKey;
use crate::error::classify_grok_http_error::classify_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::delete_file::request_types::*;
use crate::requests::xai_host::XAI_API_BASE_URL;

// ── Public args ──

#[derive(Clone, Debug)]
pub struct DeleteFileArgs {
  pub api_key: GrokApiKey,
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
pub async fn delete_file(args: DeleteFileArgs) -> Result<DeleteFileSuccess, GrokError> {
  let url = format!("{}/v1/files/{}", XAI_API_BASE_URL, args.file_id);

  info!("Grok delete_file: file_id={}", args.file_id);

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
}
