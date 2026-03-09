use crate::api::api_types::media_asset_id::MediaAssetId;
use crate::api::api_types::operation_id::OperationId;
use crate::api::requests::media_assets::prepare_upload::{prepare_upload, PrepareUploadArgs};
use crate::api::requests::media_assets::upload_to_signed_url::{upload_to_signed_url, UploadToSignedUrlArgs};
use crate::api::requests::worlds::generate_world::{generate_world, GenerateWorldArgs, ImagePrompt, WorldPrompt};
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
  pub model: Option<String>,
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
/// New flow (3 steps):
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
    kind: "image",
    extension: "jpg",
    request_timeout: args.individual_request_timeout,
  }).await?;

  let media_asset_id = prepare_response.media_asset_id;
  let upload_url = prepare_response.upload_url;
  let required_headers = prepare_response.required_headers;

  info!("Media asset ID: {}", media_asset_id);
  info!("Upload URL: {}", upload_url);

  // Step 2: Upload to signed URL
  info!("Step 2 of 3: upload_to_signed_url ...");

  upload_to_signed_url(UploadToSignedUrlArgs {
    upload_url: &upload_url,
    file_bytes,
    required_headers: &required_headers,
    request_timeout: args.individual_request_timeout,
  }).await?;

  info!("Upload complete.");

  // Step 3: Generate world
  info!("Step 3 of 3: generate_world ...");

  let world_prompt = WorldPrompt::Image {
    image_prompt: ImagePrompt::MediaAsset {
      media_asset_id: media_asset_id.clone(),
    },
    text_prompt: args.text_prompt,
    is_pano: None,
  };

  let generate_response = generate_world(GenerateWorldArgs {
    creds: args.creds,
    world_prompt,
    display_name: None,
    model: args.model,
    request_timeout: args.individual_request_timeout,
  }).await?;

  info!("Operation ID: {}", generate_response.operation_id.as_str());
  info!("Done: {}", generate_response.done);

  Ok(UploadImageAndCreateWorldResponse {
    operation_id: generate_response.operation_id,
    media_asset_id: MediaAssetId(media_asset_id),
  })
}

#[cfg(test)]
mod tests {
  use crate::recipes::upload_image_and_create_world_with_retry::{upload_image_and_create_world, FileBytesOrPath, UploadImageAndCreateWorldArgs};
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use filesys::file_read_bytes::file_read_bytes;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // Client side tests only — requires real API key
  async fn test_upload_and_generate() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    let file_path = "/Users/bt/Pictures/Midjourney/jeep.jpeg";
    let file_bytes = file_read_bytes(file_path).unwrap();

    println!("File bytes len: {}", file_bytes.len());

    let results = upload_image_and_create_world(UploadImageAndCreateWorldArgs {
      creds: &creds,
      individual_request_timeout: None,
      file: FileBytesOrPath::Bytes(file_bytes),
      text_prompt: None,
      model: None,
    }).await.unwrap();

    println!("Operation ID: {}", results.operation_id.as_str());
    println!("Media Asset ID: {}", results.media_asset_id.as_str());

    assert_eq!(1, 2);
  }
}
