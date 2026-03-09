use crate::api::api_types::media_asset_id::MediaAssetId;
use crate::api::api_types::operation_id::OperationId;
use crate::api::api_types::world_labs_model::WorldLabsModel;
use crate::api::requests::generate_world::generate_world::{generate_world, GenerateWorldArgs};
use crate::api::requests::generate_world::http_request::{ContentReference, WorldPrompt};
use crate::api::requests::prepare_upload::prepare_upload::{prepare_upload, PrepareUploadArgs, MediaAssetKind};
use crate::api::requests::upload_to_signed_url::upload_to_signed_url::{upload_to_signed_url, UploadToSignedUrlArgs};
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::world_labs_client_error::WorldLabsClientError;
use crate::error::world_labs_error::WorldLabsError;
use filesys::file_read_bytes::file_read_bytes;
use log::{error, info};
use std::path::PathBuf;
use std::time::Duration;

pub struct UploadImageAndCreateWorldArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub file: FileBytesOrPath,
  pub text_prompt: Option<String>,
  pub model: WorldLabsModel,
  pub individual_request_timeout: Option<Duration>,
}

pub enum FileBytesOrPath {
  Bytes(Vec<u8>),
  Path(PathBuf),
}

pub struct UploadImageAndCreateWorldResponse {
  pub operation_id: OperationId,
  pub media_asset_id: MediaAssetId,
}

/// Official World Labs API: Upload an image and generate a world.
///
/// Flow (3 steps):
/// 1. prepare_upload — get media_asset_id + signed upload URL
/// 2. upload_to_signed_url — PUT file bytes to signed URL
/// 3. generate_world — start world generation with media_asset source
pub async fn upload_image_and_create_world(args: UploadImageAndCreateWorldArgs<'_>) -> Result<UploadImageAndCreateWorldResponse, WorldLabsError> {

  info!("Checking file input...");

  let file_bytes = match args.file {
    FileBytesOrPath::Bytes(bytes) => {
      info!("File bytes provided ({} bytes)", bytes.len());
      bytes
    }
    FileBytesOrPath::Path(path) => {
      info!("File path provided: {:?}", path);
      match file_read_bytes(&path) {
        Ok(bytes) => bytes,
        Err(err) => {
          error!("Error reading file bytes from path: {:?} - error: {:?}", path, err);
          return Err(WorldLabsClientError::CannotReadLocalFileForUpload(err).into());
        }
      }
    }
  };

  // Step 1: Prepare upload
  info!("Step 1 of 3: prepare_upload ...");

  let prepare_response = prepare_upload(PrepareUploadArgs {
    creds: args.creds,
    file_name: "upload.jpg",
    kind: MediaAssetKind::Image,
    request_timeout: args.individual_request_timeout,
  }).await?;

  let media_asset_id = prepare_response.media_asset_id;
  let upload_url = prepare_response.upload_url;
  let required_headers = prepare_response.required_headers;

  info!("Media asset ID: {}", media_asset_id.as_str());
  info!("Upload URL: {}", upload_url);

  // Step 2: Upload to signed URL
  info!("Step 2 of 3: upload_to_signed_url ...");

  upload_to_signed_url(UploadToSignedUrlArgs {
    upload_url: &upload_url,
    file_bytes,
    required_headers: &required_headers,
    content_type: "image/jpeg",
    request_timeout: args.individual_request_timeout,
  }).await?;

  info!("Upload complete.");

  // Step 3: Generate world
  info!("Step 3 of 3: generate_world ...");

  let world_prompt = WorldPrompt::Image {
    image_prompt: ContentReference::MediaAsset {
      media_asset_id: media_asset_id.as_str().to_string(),
    },
    text_prompt: args.text_prompt,
    is_pano: None,
    disable_recaption: None,
  };

  let generate_response = generate_world(GenerateWorldArgs {
    creds: args.creds,
    world_prompt,
    display_name: None,
    model: args.model,
    seed: None,
    tags: None,
    permission: None,
    request_timeout: args.individual_request_timeout,
  }).await?;

  info!("Operation ID: {}", generate_response.operation_id.as_str());
  info!("Done: {}", generate_response.done);

  Ok(UploadImageAndCreateWorldResponse {
    operation_id: generate_response.operation_id,
    media_asset_id,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use filesys::file_read_bytes::file_read_bytes;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore]
  async fn test_upload_and_generate() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    //let file_path = "/Users/bt/Pictures/Midjourney/moon_door.png";
    let file_path = "/Users/bt/Pictures/Midjourney/meadow_mirror.png";
    let file_bytes = file_read_bytes(file_path).unwrap();

    println!("File bytes len: {}", file_bytes.len());

    let results = upload_image_and_create_world(UploadImageAndCreateWorldArgs {
      creds: &creds,
      individual_request_timeout: None,
      file: FileBytesOrPath::Bytes(file_bytes),
      text_prompt: None,
      model: WorldLabsModel::Marble0p1Plus,
    }).await.unwrap();

    println!("Operation ID: {}", results.operation_id.as_str());
    println!("Media Asset ID: {}", results.media_asset_id.as_str());

    /*
00:55:36.237287 [DEBUG] - Requesting URL: https://api.worldlabs.ai/marble/v1/worlds:generate
00:55:45.047221 [DEBUG] - Response body (200): {"operation_id":"1fab3bf1-05a1-4929-907e-c6df07c539e2","created_at":"2026-03-09T04:55:37Z","updated_at":"2026-03-09T04:55:37Z","expires_at":"2026-03-09T05:55:37Z","done":false,"error":null,"metadata":null,"response":null}
00:55:45.047756 [INFO] - Operation ID: 1fab3bf1-05a1-4929-907e-c6df07c539e2
00:55:45.047839 [INFO] - Done: false
Operation ID: 1fab3bf1-05a1-4929-907e-c6df07c539e2
Media Asset ID: bc57b2bc-542e-416d-8089-924294152f0d
     */

    assert_eq!(1, 2);
  }
}
