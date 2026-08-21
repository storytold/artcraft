use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::text::hunyuan_3d_3p1_rapid_text_to_mesh::raw_request::{
  Hunyuan3d3p1RapidTextToMeshInput, Hunyuan3d3p1RapidTextToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hunyuan 3D v3.1 Rapid text-to-3D — the fast, low-cost tier.
///
/// NB: the rapid schema is minimal — no `generate_type`, `face_count`, or
/// `polygon_type`. Geometry-only output is a boolean (`enable_geometry`)
/// rather than a generation-type enum.
#[derive(Clone, Debug)]
pub struct Hunyuan3d3p1RapidTextToMeshRequest {
  /// Text prompt describing the 3D object (max 200 UTF-8 characters).
  pub prompt: String,

  /// Whether to enable PBR (physically-based rendering) materials.
  /// fal's default is false when `None`. Enabling adds cost.
  pub enable_pbr: Option<bool>,

  /// Generate a geometry-only white model without textures.
  /// fal's default is false when `None`. Disables PBR output.
  pub enable_geometry: Option<bool>,
}

impl FalEndpoint for Hunyuan3d3p1RapidTextToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan-3d/v3.1/rapid/text-to-3d";

  type RawRequest = Hunyuan3d3p1RapidTextToMeshInput;
  type RawResponse = Hunyuan3d3p1RapidTextToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
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

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1RapidTextToMeshRequest {
      prompt: "a small ceramic teapot".to_string(),
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
  async fn test_text_to_mesh_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1RapidTextToMeshRequest {
      prompt: "a wooden rocking chair".to_string(),
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
    let request = Hunyuan3d3p1RapidTextToMeshRequest {
      prompt: "p".to_string(),
      enable_pbr: Some(true),
      enable_geometry: Some(false),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "prompt": "p", "enable_pbr": true, "enable_geometry": false }),
    );
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Hunyuan3d3p1RapidTextToMeshRequest {
      prompt: "p".to_string(),
      enable_pbr: None,
      enable_geometry: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "p" }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Hunyuan3d3p1RapidTextToMeshRequest::ENDPOINT,
      "fal-ai/hunyuan-3d/v3.1/rapid/text-to-3d",
    );
  }

  // NB: Pricing tests are in cost.rs
}
