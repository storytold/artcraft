use crate::api::api_types::media_asset_id::MediaAssetId;
use crate::api::requests::prepare_upload::http_request::{RawRequest, RawResponse};
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use std::collections::HashMap;
use std::time::Duration;
use wreq::Client;

const URL: &str = "https://api.worldlabs.ai/marble/v1/media-assets:prepare_upload";

/// The kind of media asset to upload.
#[derive(Clone, Copy, Debug)]
pub enum MediaAssetKind {
  Image,
  Video,
}

impl MediaAssetKind {
  fn as_str(&self) -> &'static str {
    match self {
      Self::Image => "image",
      Self::Video => "video",
    }
  }
}

pub struct PrepareUploadArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub file_name: &'a str,
  pub kind: MediaAssetKind,
  pub request_timeout: Option<Duration>,
}

pub struct PrepareUploadResponse {
  pub media_asset_id: MediaAssetId,
  pub upload_url: String,
  pub upload_method: String,
  pub required_headers: HashMap<String, String>,
}

/// Parse the file extension from a file name, defaulting to "png".
fn extension_from_file_name(file_name: &str) -> String {
  file_name
    .rsplit_once('.')
    .map(|(_, ext)| ext.to_lowercase())
    .unwrap_or_else(|| "png".to_string())
}

/// POST /marble/v1/media-assets:prepare_upload
///
/// Get a signed upload URL and media_asset_id for uploading a file.
/// The extension is parsed from `file_name`; defaults to "png" if none found.
pub async fn prepare_upload(args: PrepareUploadArgs<'_>) -> Result<PrepareUploadResponse, WorldLabsError> {
  let client = Client::new();

  let extension = extension_from_file_name(args.file_name);

  let payload = RawRequest {
    file_name: args.file_name.to_string(),
    kind: args.kind.as_str().to_string(),
    extension: Some(extension),
    metadata: None,
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
    error!("prepare_upload returned error (code {}): {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let raw: RawResponse = serde_json::from_str(&response_body)
    .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(PrepareUploadResponse {
    media_asset_id: MediaAssetId(raw.media_asset.media_asset_id),
    upload_url: raw.upload_info.upload_url,
    upload_method: raw.upload_info.upload_method,
    required_headers: raw.upload_info.required_headers.unwrap_or_default(),
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
  async fn test_prepare_upload() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    let response = prepare_upload(PrepareUploadArgs {
      creds: &creds,
      file_name: "test_image.jpg",
      kind: MediaAssetKind::Image,
      request_timeout: None,
    }).await.unwrap();

    println!("Media asset ID: {}", response.media_asset_id.as_str());
    println!("Upload URL: {}", response.upload_url);
    println!("Upload method: {}", response.upload_method);
    println!("Required headers: {:?}", response.required_headers);

    assert_eq!(1, 2);
  }

  #[test]
  fn test_extension_parsing() {
    assert_eq!(extension_from_file_name("photo.jpg"), "jpg");
    assert_eq!(extension_from_file_name("image.PNG"), "png");
    assert_eq!(extension_from_file_name("video.mp4"), "mp4");
    assert_eq!(extension_from_file_name("no_extension"), "png");
    assert_eq!(extension_from_file_name("multi.dots.webp"), "webp");
  }
}
