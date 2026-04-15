use crate::api::api_types::operation_id::OperationId;
use crate::api::api_types::world_labs_model::WorldLabsModel;
use crate::api::requests::generate_world::http_request::{RawRequest, RawResponse, WorldPrompt, Permission};
use crate::credentials::world_labs_api_creds::WorldLabsApiCreds;
use crate::error::filter_world_labs_http_error::filter_world_labs_http_error;
use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use log::{debug, error};
use std::time::Duration;
use wreq::Client;

const URL: &str = "https://api.worldlabs.ai/marble/v1/worlds:generate";

pub struct GenerateWorldArgs<'a> {
  pub creds: &'a WorldLabsApiCreds,
  pub world_prompt: WorldPrompt,
  pub display_name: Option<String>,
  pub model: WorldLabsModel,
  pub seed: Option<u32>,
  pub tags: Option<Vec<String>>,
  pub permission: Option<Permission>,
  pub request_timeout: Option<Duration>,
}

pub struct GenerateWorldResponse {
  pub operation_id: OperationId,
  pub done: bool,
}

/// POST /marble/v1/worlds:generate
///
/// Start world generation. Returns an operation_id to poll with get_operation.
pub async fn generate_world(args: GenerateWorldArgs<'_>) -> Result<GenerateWorldResponse, WorldLabsError> {
  let client = Client::new();

  let payload = RawRequest {
    world_prompt: args.world_prompt,
    display_name: args.display_name,
    model: Some(args.model.get_model_api_name_str().to_string()),
    seed: args.seed,
    tags: args.tags,
    permission: args.permission,
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
      error!("Error during generate_world request: {:?}", err);
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
    error!("generate_world returned error (code {}): {:?}", status.as_u16(), response_body);
  }

  filter_world_labs_http_error(status, Some(&response_body))?;

  debug!("Response body (200): {}", response_body);

  let raw: RawResponse = serde_json::from_str(&response_body)
    .map_err(|err| WorldLabsGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(GenerateWorldResponse {
    operation_id: OperationId(raw.operation_id),
    done: raw.done.unwrap_or(false),
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::requests::generate_world::http_request::{ContentReference, WorldPrompt};
  use crate::api::requests::prepare_upload::prepare_upload::{prepare_upload, PrepareUploadArgs, MediaAssetKind};
  use crate::api::requests::upload_to_signed_url::upload_to_signed_url::{upload_to_signed_url, UploadToSignedUrlArgs};
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use filesys::file_read_bytes::file_read_bytes;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore]
  async fn test_generate_world_text_prompt() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    let response = generate_world(GenerateWorldArgs {
      creds: &creds,
      world_prompt: WorldPrompt::Text {
        text_prompt: Some("A cozy cabin in the snowy mountains".to_string()),
        disable_recaption: None,
      },
      display_name: Some("Test World".to_string()),
      model: WorldLabsModel::Marble0p1Mini,
      seed: None,
      tags: None,
      permission: None,
      request_timeout: None,
    }).await.unwrap();

    println!("Operation ID: {}", response.operation_id.as_str());
    println!("Done: {}", response.done);

    assert_eq!(1, 2);
  }

  #[tokio::test]
  #[ignore]
  async fn test_generate_world_image_uri() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    let response = generate_world(GenerateWorldArgs {
      creds: &creds,
      world_prompt: WorldPrompt::Image {
        image_prompt: ContentReference::Uri {
          uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png".to_string(),
        },
        text_prompt: None,
        is_pano: None,
        disable_recaption: None,
      },
      display_name: None,
      model: WorldLabsModel::Marble0p1Mini,
      seed: None,
      tags: None,
      permission: None,
      request_timeout: None,
    }).await.unwrap();

    println!("Operation ID: {}", response.operation_id.as_str());
    println!("Done: {}", response.done);

    assert_eq!(1, 2);
  }

  /// End-to-end: upload a safe image step by step (prepare → upload →
  /// generate_world), printing each step's result for debugging.
  ///
  /// Uses a synthetic gradient PNG from test_data/.
  #[tokio::test]
  #[ignore]
  async fn test_generate_world_for_safe_image() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    // --- Read file ---
    let file_bytes = file_read_bytes("/Users/bt/dev/storyteller/artcraft/test_data/image/mochi.jpg")
        .expect("failed to read safe test image");
    println!("Read {} bytes from safe test image", file_bytes.len());

    // --- Step 1: prepare_upload ---
    println!("\n=== Step 1: prepare_upload ===");
    let prepare_result = prepare_upload(PrepareUploadArgs {
      creds: &creds,
      file_name: "mochi.jpg",
      kind: MediaAssetKind::Image,
      request_timeout: None,
    }).await;

    println!("prepare_upload result: {:?}", prepare_result.as_ref().map(|r| &r.media_asset_id));

    let prepare_response = match prepare_result {
      Ok(r) => {
        println!("  Media Asset ID: {}", r.media_asset_id.as_str());
        println!("  Upload URL: {}", r.upload_url);
        println!("  Required headers: {:?}", r.required_headers);
        r
      }
      Err(err) => {
        println!("  ERROR at prepare_upload: {:?}", err);
        panic!("prepare_upload failed: {:?}", err);
      }
    };

    // --- Step 2: upload_to_signed_url ---
    println!("\n=== Step 2: upload_to_signed_url ===");
    let upload_result = upload_to_signed_url(UploadToSignedUrlArgs {
      upload_url: &prepare_response.upload_url,
      file_bytes,
      required_headers: &prepare_response.required_headers,
      content_type: "image/jpeg",
      request_timeout: None,
    }).await;

    match &upload_result {
      Ok(()) => println!("  Upload succeeded."),
      Err(err) => {
        println!("  ERROR at upload_to_signed_url: {:?}", err);
        panic!("upload_to_signed_url failed: {:?}", err);
      }
    }

    // --- Step 3: generate_world ---
    println!("\n=== Step 3: generate_world ===");
    let generate_result = generate_world(GenerateWorldArgs {
      creds: &creds,
      world_prompt: WorldPrompt::Image {
        image_prompt: ContentReference::MediaAsset {
          media_asset_id: prepare_response.media_asset_id.as_str().to_string(),
        },
        text_prompt: Some("A colorful gradient landscape".to_string()),
        is_pano: None,
        disable_recaption: None,
      },
      display_name: None,
      model: WorldLabsModel::Marble0p1Mini,
      seed: None,
      tags: None,
      permission: None,
      request_timeout: None,
    }).await;

    match &generate_result {
      Ok(r) => {
        println!("  SUCCESS — safe image");
        println!("  Operation ID: {}", r.operation_id.as_str());
        println!("  Done: {}", r.done);
      }
      Err(err) => {
        println!("  ERROR at generate_world: {:?}", err);
      }
    }

    assert_eq!(1, 2, "Inspect output above");
  }

  /// End-to-end: upload an NSFW image step by step (prepare → upload →
  /// generate_world), printing each step's result for debugging.
  ///
  /// We expect the NSFW rejection to happen at one of these steps.
  /// This test helps us identify *which* step returns the moderation error
  /// and what the error response body looks like.
  ///
  /// NB: Place the NSFW test image at `test_data/images/nsfw_test_image.png`.
  /// This file is NOT checked into git.
  #[tokio::test]
  #[ignore]
  async fn test_generate_world_for_nsfw_image() {
    setup_test_logging(LevelFilter::Debug);

    let creds = get_test_api_key().unwrap();

    // --- Read file ---
    let file_bytes = file_read_bytes("/Users/bt/Pictures/nsfw_test/nsfw_test_1.jpg")
        .expect("failed to read NSFW test image");
    println!("Read {} bytes from NSFW test image", file_bytes.len());

    // --- Step 1: prepare_upload ---
    println!("\n=== Step 1: prepare_upload ===");
    let prepare_result = prepare_upload(PrepareUploadArgs {
      creds: &creds,
      file_name: "nsfw_test_1.jpg",
      kind: MediaAssetKind::Image,
      request_timeout: None,
    }).await;

    let prepare_response = match prepare_result {
      Ok(r) => {
        println!("  OK — Media Asset ID: {}", r.media_asset_id.as_str());
        println!("  Upload URL: {}", r.upload_url);
        r
      }
      Err(err) => {
        println!("  NSFW CAUGHT AT STEP 1 (prepare_upload)!");
        println!("  Error (Debug): {:?}", err);
        println!("  Error (Display): {}", err);
        assert_eq!(1, 2, "NSFW caught at prepare_upload — inspect output above");
        unreachable!();
      }
    };

    // --- Step 2: upload_to_signed_url ---
    println!("\n=== Step 2: upload_to_signed_url ===");
    let upload_result = upload_to_signed_url(UploadToSignedUrlArgs {
      upload_url: &prepare_response.upload_url,
      file_bytes,
      required_headers: &prepare_response.required_headers,
      content_type: "image/jpeg",
      request_timeout: None,
    }).await;

    match &upload_result {
      Ok(()) => println!("  OK — upload succeeded."),
      Err(err) => {
        println!("  NSFW CAUGHT AT STEP 2 (upload_to_signed_url)!");
        println!("  Error (Debug): {:?}", err);
        println!("  Error (Display): {}", err);
        assert_eq!(1, 2, "NSFW caught at upload — inspect output above");
      }
    }

    // --- Step 3: generate_world ---
    println!("\n=== Step 3: generate_world ===");
    let generate_result = generate_world(GenerateWorldArgs {
      creds: &creds,
      world_prompt: WorldPrompt::Image {
        image_prompt: ContentReference::MediaAsset {
          media_asset_id: prepare_response.media_asset_id.as_str().to_string(),
        },
        text_prompt: None,
        is_pano: None,
        disable_recaption: None,
      },
      display_name: None,
      model: WorldLabsModel::Marble0p1Mini,
      seed: None,
      tags: None,
      permission: None,
      request_timeout: None,
    }).await;

    match &generate_result {
      Ok(r) => {
        println!("  UNEXPECTED SUCCESS — NSFW image was NOT rejected at generate_world!");
        println!("  Operation ID: {}", r.operation_id.as_str());
        println!("  Done: {}", r.done);
      }
      Err(err) => {
        println!("  NSFW CAUGHT AT STEP 3 (generate_world)!");
        println!("  Error (Debug): {:?}", err);
        println!("  Error (Display): {}", err);
      }
    }

    assert_eq!(1, 2, "Inspect output above");
  }
}
