use crate::api::api_types::upload_mime_type::UploadMimeType;
use crate::api::common::common_header_values::{ORIGIN_VALUE, REFERER_VALUE};
use crate::credentials::world_labs_bearer_token::WorldLabsBearerToken;
use crate::credentials::world_labs_cookies::WorldLabsCookies;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use crate::error::world_labs_specific_api_error::WorldLabsSpecificApiError;
use http_headers::names::{PRIORITY, SEC_FETCH_DEST, SEC_FETCH_MODE, SEC_FETCH_SITE, SEC_GPC};
use http_headers::values::accept::ACCEPT_ALL;
use http_headers::values::cache_control::CACHE_CONTROL_NO_CACHE;
use http_headers::values::connection::CONNECTION_KEEP_ALIVE;
use http_headers::values::pragma::PRAGMA_NO_CACHE;
use http_headers::values::priority::PRIORITY_6;
use http_headers::values::sec::{SEC_FETCH_DEST_EMPTY, SEC_FETCH_MODE_CORS, SEC_FETCH_SITE_CROSS_SITE};
use http_headers::values::te::TE_TRAILERS;
use log::{debug, error};
use serde::Serialize;
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, AUTHORIZATION, CACHE_CONTROL, CONNECTION, CONTENT_LENGTH, CONTENT_TYPE, ORIGIN, PRAGMA, REFERER, TE};
use wreq::Client;
use wreq_util::Emulation;

pub struct GoogleUploadImageArgs<'a> {
  pub upload_url: &'a str,
  pub upload_mime_type: UploadMimeType,
  pub file_bytes: Vec<u8>,
  pub request_timeout: Option<Duration>,
}

/// Marble Image-to-World
/// Upload the binary to GCP using the signed URL
/// Request #4 (of ~10)
pub async fn google_upload_image(args: GoogleUploadImageArgs<'_>) -> Result<(), WorldLabsError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| WorldLabsClientError::WreqClientError(err))?;

  let content_type = args.upload_mime_type.content_type();

  debug!("Requesting URL: {}", args.upload_url);

  let mut request_builder = client.put(args.upload_url)
      .header(CONTENT_TYPE, content_type)
      .header("x-goog-content-length-range", "0,1048576000");

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let http_request = request_builder
      .body(args.file_bytes)
      .build()
      .map_err(|err| {
        error!("Error building request: {:?}", err);
        WorldLabsClientError::WreqClientError(err)
      })?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| {
        error!("Error during request execution: {:?}", err);
        WorldLabsGenericApiError::WreqError(err)
      })?;

  let status = response.status();

  let response_body = response.text()
      .await
      .map_err(|err| {
        error!("Error reading response body: {:?}", err);
        WorldLabsGenericApiError::WreqError(err)
      })?;

  if !status.is_success() {
    error!("Request returned an error (code {}) : {:?}", status.as_u16(), response_body);

    if response_body.contains("SignatureDoesNotMatch") || response_body.contains("does not match the signature") {
      return Err(WorldLabsSpecificApiError::GoogleUploadSignatureDoesNotMatch.into());
    } else {
      return Err(WorldLabsGenericApiError::GoogleUploadFailed { status_code: status, body: response_body }.into());
    }
  }

  Ok(())
}

#[cfg(test)]
mod tests {
}
