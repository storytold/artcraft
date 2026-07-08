use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::image::meshy_v6_image_to_mesh::raw_request::{
  MeshyV6ImageToMeshInput, MeshyV6ImageToMeshOutput,
};
use crate::requests::api::mesh::text::meshy_v6_text_to_mesh::api::{
  MeshyV6ModelType, MeshyV6PoseMode, MeshyV6SymmetryMode, MeshyV6Topology,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Meshy 6 image-to-3D. Shares its option enums with the text binding.
///
/// NB: unlike text-to-3d, the image schema has no `mode`, `seed`, or
/// `enable_prompt_expansion`, and adds `should_texture`.
#[derive(Clone, Debug)]
pub struct MeshyV6ImageToMeshRequest {
  /// URL of the input image (required).
  pub image_url: String,

  /// Model type. fal's default is `Standard` when `None`.
  pub model_type: Option<MeshyV6ModelType>,

  /// Mesh topology. fal's default is `Triangle` when `None`.
  pub topology: Option<MeshyV6Topology>,

  /// Target polygon count. Range 100-300000; fal's default is 30000.
  pub target_polycount: Option<u32>,

  /// Symmetry mode. fal's default is `Auto` when `None`.
  pub symmetry_mode: Option<MeshyV6SymmetryMode>,

  /// Whether to remesh the output. fal's default is true when `None`.
  pub should_remesh: Option<bool>,

  /// Whether to texture the output. fal's default is true when `None`.
  pub should_texture: Option<bool>,

  /// Whether to generate PBR materials. fal's default is false when `None`.
  pub enable_pbr: Option<bool>,

  /// Character pose mode. Unspecified when `None` (fal's default).
  pub pose_mode: Option<MeshyV6PoseMode>,

  /// Optional texture-specific prompt.
  pub texture_prompt: Option<String>,

  /// Optional texture reference image URL.
  pub texture_image_url: Option<String>,

  /// Rig the generated character. fal's default is false when `None`.
  pub enable_rigging: Option<bool>,

  /// Character height for rigging, in meters. fal's default is 1.7.
  pub rigging_height_meters: Option<f32>,

  /// Animate the rigged character. fal's default is false when `None`.
  pub enable_animation: Option<bool>,

  /// Animation action ID. Range 0-696; fal's default is 92.
  pub animation_action_id: Option<u32>,

  /// fal's default is true when `None`.
  pub enable_safety_checker: Option<bool>,
}

impl FalEndpoint for MeshyV6ImageToMeshRequest {
  const ENDPOINT: &str = "fal-ai/meshy/v6/image-to-3d";

  type RawRequest = MeshyV6ImageToMeshInput;
  type RawResponse = MeshyV6ImageToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      image_url: self.image_url.clone(),
      model_type: self.model_type.map(|m| m.to_str().to_string()),
      topology: self.topology.map(|t| t.to_str().to_string()),
      target_polycount: self.target_polycount,
      symmetry_mode: self.symmetry_mode.map(|s| s.to_str().to_string()),
      should_remesh: self.should_remesh,
      should_texture: self.should_texture,
      enable_pbr: self.enable_pbr,
      pose_mode: self.pose_mode.map(|p| p.to_str().to_string()),
      texture_prompt: self.texture_prompt.clone(),
      texture_image_url: self.texture_image_url.clone(),
      enable_rigging: self.enable_rigging,
      rigging_height_meters: self.rigging_height_meters,
      enable_animation: self.enable_animation,
      animation_action_id: self.animation_action_id,
      enable_safety_checker: self.enable_safety_checker,
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

  fn base_request() -> MeshyV6ImageToMeshRequest {
    MeshyV6ImageToMeshRequest {
      image_url: "https://example.com/input.jpg".to_string(),
      model_type: None,
      topology: None,
      target_polycount: None,
      symmetry_mode: None,
      should_remesh: None,
      should_texture: None,
      enable_pbr: None,
      pose_mode: None,
      texture_prompt: None,
      texture_image_url: None,
      enable_rigging: None,
      rigging_height_meters: None,
      enable_animation: None,
      animation_action_id: None,
      enable_safety_checker: None,
    }
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = MeshyV6ImageToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ..base_request()
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
    let request = MeshyV6ImageToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ..base_request()
    };
    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_core_fields() {
    let request = MeshyV6ImageToMeshRequest {
      model_type: Some(MeshyV6ModelType::LowPoly),
      topology: Some(MeshyV6Topology::Quad),
      should_texture: Some(false),
      enable_pbr: Some(true),
      ..base_request()
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json["image_url"], "https://example.com/input.jpg");
    assert_eq!(json["model_type"], "lowpoly");
    assert_eq!(json["topology"], "quad");
    assert_eq!(json["should_texture"], false);
    assert_eq!(json["enable_pbr"], true);
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let json = serde_json::to_value(base_request().to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "image_url": "https://example.com/input.jpg" }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(MeshyV6ImageToMeshRequest::ENDPOINT, "fal-ai/meshy/v6/image-to-3d");
  }

  // NB: Pricing tests are in cost.rs
}
