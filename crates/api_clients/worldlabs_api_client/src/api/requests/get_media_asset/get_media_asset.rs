use crate::api::requests::get_media_asset::http_request::RawResponse;
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use std::time::Duration;
use wreq::Client;

const BASE_URL: &str = "https://api.worldlabs.ai/marble/v1/media-assets";

pub struct GetMediaAssetArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub media_asset_id: &'a str,
  pub request_timeout: Option<Duration>,
}

pub struct GetMediaAssetResponse {
  pub media_asset_id: String,
  pub file_name: String,
  pub kind: String,
  pub extension: Option<String>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
}

/// GET /marble/v1/media-assets/{media_asset_id}
///
/// Get info about a previously uploaded media asset.
pub async fn get_media_asset(args: GetMediaAssetArgs<'_>) -> Result<GetMediaAssetResponse, WorldLabsError> {
  let client = Client::new();

  let url = format!("{}/{}", BASE_URL, args.media_asset_id);

  debug!("Requesting URL: {}", url);

  let mut request_builder = client.get(&url)
    .header("WLT-Api-Key", args.creds.api_key());

  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder.send()
    .await
    .map_err(|err| {
      error!("Error during get_media_asset request: {:?}", err);
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
    error!("get_media_asset returned error (code {}): {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let raw: RawResponse = serde_json::from_str(&response_body)
    .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(GetMediaAssetResponse {
    media_asset_id: raw.media_asset_id,
    file_name: raw.file_name,
    kind: raw.kind,
    extension: raw.extension,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore]
  async fn test_get_media_asset() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    // Use a known media_asset_id from a previous prepare_upload call
    let media_asset_id = "REPLACE_WITH_REAL_ID";

    let response = get_media_asset(GetMediaAssetArgs {
      creds: &creds,
      media_asset_id,
      request_timeout: None,
    }).await.unwrap();

    println!("Media asset ID: {}", response.media_asset_id);
    println!("File name: {}", response.file_name);
    println!("Kind: {}", response.kind);
    println!("Extension: {:?}", response.extension);
    println!("Created at: {:?}", response.created_at);

    assert_eq!(1, 2);
  }
}
