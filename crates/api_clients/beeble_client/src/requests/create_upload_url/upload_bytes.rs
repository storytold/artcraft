use log::info;

use crate::creds::beeble_api_key::BeebleApiKey;
use crate::error::beeble_client_error::BeebleClientError;
use crate::error::beeble_error::BeebleError;
use crate::error::beeble_generic_api_error::BeebleGenericApiError;
use crate::requests::create_upload_url::create_upload_url::{
  create_upload_url, CreateUploadUrlArgs, CreateUploadUrlSuccess,
};

/// Upload bytes to Beeble in one call (create presigned URL + PUT bytes).
///
/// Returns the upload success with the `beeble_uri` to use in generation calls.
pub async fn upload_bytes_to_beeble(
  api_key: &BeebleApiKey,
  filename: &str,
  content_type: &str,
  bytes: Vec<u8>,
) -> Result<CreateUploadUrlSuccess, BeebleError> {
  info!("Uploading {} bytes to Beeble as {}", bytes.len(), filename);

  // 1. Get presigned URL.
  let upload = create_upload_url(CreateUploadUrlArgs {
    api_key: api_key.clone(),
    filename: filename.to_string(),
  }).await?;

  info!("Beeble upload URL obtained: {}", upload.beeble_uri);

  // 2. PUT bytes to presigned URL.
  let client = reqwest::Client::new();
  let put_response = client.put(&upload.upload_url)
    .header("Content-Type", content_type)
    .body(bytes)
    .send()
    .await
    .map_err(|err| BeebleGenericApiError::ReqwestError(err))?;

  let status = put_response.status();
  if !status.is_success() {
    let body = put_response.text().await.unwrap_or_default();
    return Err(BeebleGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body,
    }.into());
  }

  info!("Beeble upload PUT succeeded: {}", upload.beeble_uri);
  Ok(upload)
}
