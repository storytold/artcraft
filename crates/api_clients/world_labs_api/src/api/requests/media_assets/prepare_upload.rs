use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use wreq::Client;

const URL: &str = "https://api.worldlabs.ai/marble/v1/media-assets:prepare_upload";

pub struct PrepareUploadArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub file_name: &'a str,
  /// "image" or "video"
  pub kind: &'a str,
  pub extension: &'a str,
  pub request_timeout: Option<Duration>,
}

pub struct PrepareUploadResponse {
  pub media_asset_id: String,
  pub upload_url: String,
  pub upload_method: String,
  pub required_headers: HashMap<String, String>,
}

pub async fn prepare_upload(args: PrepareUploadArgs<'_>) -> Result<PrepareUploadResponse, WorldLabsError> {
  let client = Client::new();

  let payload = RawRequest {
    file_name: args.file_name.to_string(),
    kind: args.kind.to_string(),
    extension: args.extension.to_string(),
  };

  debug!("Requesting URL: {}", URL);

  let mut request_builder = client.post(URL)
    .header("WLT-Api-Key", args.creds.api_key())
    .header("Content-Type", "application/json")
    .json(&payload);

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder.send()
    .await
    .map_err(|err| {
      error!("Error during prepare_upload request: {:?}", err);
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
    error!("prepare_upload returned error (code {}) : {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let raw: RawResponse = serde_json::from_str(&response_body)
    .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(PrepareUploadResponse {
    media_asset_id: raw.media_asset.media_asset_id,
    upload_url: raw.upload_info.upload_url,
    upload_method: raw.upload_info.upload_method,
    required_headers: raw.upload_info.required_headers.unwrap_or_default(),
  })
}

#[derive(Serialize)]
struct RawRequest {
  pub file_name: String,
  pub kind: String,
  pub extension: String,
}

#[derive(Deserialize)]
struct RawResponse {
  pub media_asset: RawMediaAsset,
  pub upload_info: RawUploadInfo,
}

#[derive(Deserialize)]
struct RawMediaAsset {
  pub media_asset_id: String,
}

#[derive(Deserialize)]
struct RawUploadInfo {
  pub upload_url: String,
  pub upload_method: String,
  pub required_headers: Option<HashMap<String, String>>,
}
