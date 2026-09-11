use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::image::hunyuan_3d_3p1_rapid_image_to_mesh::raw_request::{
  Hunyuan3d3p1RapidImageToMeshInput, Hunyuan3d3p1RapidImageToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hunyuan 3D v3.1 Rapid image-to-3D — the fast, low-cost tier.
///
/// NB: the rapid schema is minimal — single input image (no multi-view), no
/// `generate_type`, `face_count`, or `polygon_type`. Geometry-only output is
/// a boolean (`enable_geometry`).
#[derive(Clone, Debug)]
pub struct Hunyuan3d3p1RapidImageToMeshRequest {
  /// URL of the input image (required).
  pub image_url: String,

  /// Whether to enable PBR (physically-based rendering) materials.
  /// fal's default is false when `None`. Enabling adds cost.
  pub enable_pbr: Option<bool>,

  /// Generate a geometry-only white model without textures.
  /// fal's default is false when `None`. Disables PBR output.
  pub enable_geometry: Option<bool>,
}

impl FalEndpoint for Hunyuan3d3p1RapidImageToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d";

  type RawRequest = Hunyuan3d3p1RapidImageToMeshInput;
  type RawResponse = Hunyuan3d3p1RapidImageToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      input_image_url: self.image_url.clone(),
      enable_pbr: self.enable_pbr,
      enable_geometry: self.enable_geometry,
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

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1RapidImageToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      enable_pbr: None,
      enable_geometry: None,
    };
    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_mesh_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1RapidImageToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      enable_pbr: None,
      enable_geometry: None,
    };
    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Hunyuan3d3p1RapidImageToMeshRequest {
      image_url: "https://example.com/front.jpg".to_string(),
      enable_pbr: Some(true),
      enable_geometry: Some(true),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "input_image_url": "https://example.com/front.jpg",
        "enable_pbr": true,
        "enable_geometry": true,
      }),
    );
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Hunyuan3d3p1RapidImageToMeshRequest {
      image_url: "https://example.com/front.jpg".to_string(),
      enable_pbr: None,
      enable_geometry: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "input_image_url": "https://example.com/front.jpg" }),
    );
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Hunyuan3d3p1RapidImageToMeshRequest::ENDPOINT,
      "fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d",
    );
  }

  // NB: Pricing tests are in cost.rs
}
