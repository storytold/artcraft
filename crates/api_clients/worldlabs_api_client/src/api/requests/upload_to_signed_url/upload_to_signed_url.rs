use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use std::collections::HashMap;
use std::time::Duration;
use wreq::Client;

pub struct UploadToSignedUrlArgs<'a> {
  pub upload_url: &'a str,
  pub file_bytes: Vec<u8>,
  pub required_headers: &'a HashMap<String, String>,
  pub content_type: &'a str,
  pub request_timeout: Option<Duration>,
}

/// PUT {upload_url}
///
/// Upload raw file bytes to the signed URL returned by prepare_upload.
/// Include any required_headers from the prepare_upload response.
pub async fn upload_to_signed_url(args: UploadToSignedUrlArgs<'_>) -> Result<(), WorldLabsError> {
  let client = Client::new();

  debug!("Uploading to signed URL: {}", args.upload_url);

  let mut request_builder = client.put(args.upload_url)
    .header("Content-Type", args.content_type)
    .body(args.file_bytes);

  for (key, value) in args.required_headers {
    request_builder = request_builder.header(key.as_str(), value.as_str());
  }

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder.send()
    .await
    .map_err(|err| {
      error!("Error during signed URL upload: {:?}", err);
      WorldLabsGenericApiError::WreqError(err)
    })?;

  let status = response.status();

  if !status.is_success() {
    let body = response.text()
      .await
      .unwrap_or_default();
    error!("Signed URL upload failed (code {}): {:?}", status.as_u16(), body);
    return Err(WorldLabsGenericApiError::GoogleUploadFailed {
      status_code: status,
      body,
    }.into());
  }

  debug!("Upload to signed URL succeeded");

  Ok(())
}

#[cfg(test)]
mod tests {
  // Upload tests are covered by the end-to-end recipe test,
  // since this endpoint requires a fresh signed URL from prepare_upload.
}
