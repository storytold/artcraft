use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::sketch::hunyuan3d_3_sketch_to_mesh::raw_request::{
  Hunyuan3d3SketchToMeshInput, Hunyuan3d3SketchToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hunyuan3D V3 sketch-to-3D: turns a sketch or line-art image plus a text
/// prompt into a textured 3D mesh.
///
/// NB: unlike the v3 image-to-3d and text-to-3d endpoints, fal's published
/// sketch-to-3d schema has no `generate_type` or `polygon_type` parameters.
#[derive(Clone, Debug)]
pub struct Hunyuan3d3SketchToMeshRequest {
  /// URL of the sketch or line-art image. Resolution must be between
  /// 128x128 and 5000x5000 pixels.
  pub image_url: String,

  /// Text prompt describing the 3D content attributes such as color,
  /// category, and material.
  pub prompt: String,

  /// Target face count for the output mesh. Range 40000-1500000;
  /// fal's default is 500000 when `None`. Setting a custom value adds cost.
  pub face_count: Option<u32>,

  /// Whether to enable PBR (physically-based rendering) materials.
  /// fal's default is false when `None`. Enabling adds cost.
  pub enable_pbr: Option<bool>,
}

impl FalEndpoint for Hunyuan3d3SketchToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan3d-v3/sketch-to-3d";

  type RawRequest = Hunyuan3d3SketchToMeshInput;
  type RawResponse = Hunyuan3d3SketchToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      input_image_url: self.image_url.clone(),
      prompt: self.prompt.clone(),
      face_count: self.face_count,
      enable_pbr: self.enable_pbr,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_endpoint_trait::FalEndpoint;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::ERNEST_SCARED_STUPID_IMAGE_URL;

  // ── Real requests (manually run; require a live key and cost money) ──

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_sketch_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Hunyuan3d3SketchToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      prompt: "A cute robot".to_string(),
      face_count: None,
      enable_pbr: None,
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_sketch_to_mesh_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Hunyuan3d3SketchToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      prompt: "A cute robot".to_string(),
      face_count: None,
      enable_pbr: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Hunyuan3d3SketchToMeshRequest {
      image_url: "https://example.com/sketch.png".to_string(),
      prompt: "A red ceramic teapot".to_string(),
      face_count: Some(100_000),
      enable_pbr: Some(true),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "input_image_url": "https://example.com/sketch.png",
        "prompt": "A red ceramic teapot",
        "face_count": 100_000,
        "enable_pbr": true,
      }),
    );
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Hunyuan3d3SketchToMeshRequest {
      image_url: "https://example.com/sketch.png".to_string(),
      prompt: "minimal".to_string(),
      face_count: None,
      enable_pbr: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "input_image_url": "https://example.com/sketch.png",
        "prompt": "minimal",
      }),
    );
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Hunyuan3d3SketchToMeshRequest::ENDPOINT, "fal-ai/hunyuan3d-v3/sketch-to-3d");
  }

  // NB: Pricing tests are in cost.rs
}
