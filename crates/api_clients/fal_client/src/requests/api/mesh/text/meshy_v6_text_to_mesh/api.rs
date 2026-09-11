use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::text::meshy_v6_text_to_mesh::raw_request::{
  MeshyV6TextToMeshInput, MeshyV6TextToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Meshy 6 text-to-3D.
#[derive(Clone, Debug)]
pub struct MeshyV6TextToMeshRequest {
  /// Text prompt describing the 3D object (max 600 characters).
  pub prompt: String,

  /// Generation mode. fal's default is `Full` when `None`.
  pub mode: Option<MeshyV6Mode>,

  /// Seed for reproducibility.
  pub seed: Option<i64>,

  /// Model type. fal's default is `Standard` when `None`.
  pub model_type: Option<MeshyV6ModelType>,

  /// Mesh topology. fal's default is `Triangle` when `None`.
  pub topology: Option<MeshyV6Topology>,

  /// Target polygon count. Range 100-300000; fal's default is 30000.
  pub target_polycount: Option<u32>,

  /// Whether to remesh the output. fal's default is true when `None`.
  pub should_remesh: Option<bool>,

  /// Symmetry mode. fal's default is `Auto` when `None`.
  pub symmetry_mode: Option<MeshyV6SymmetryMode>,

  /// Whether to generate PBR materials. fal's default is false when `None`.
  pub enable_pbr: Option<bool>,

  /// Character pose mode. Unspecified when `None` (fal's default).
  pub pose_mode: Option<MeshyV6PoseMode>,

  /// Let Meshy expand/rewrite the prompt. fal's default is false when `None`.
  pub enable_prompt_expansion: Option<bool>,

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

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MeshyV6Mode {
  Preview,
  Full,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MeshyV6ModelType {
  Standard,
  LowPoly,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MeshyV6Topology {
  Quad,
  Triangle,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MeshyV6SymmetryMode {
  Off,
  Auto,
  On,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MeshyV6PoseMode {
  APose,
  TPose,
}

impl MeshyV6Mode {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Preview => "preview",
      Self::Full => "full",
    }
  }
}

impl MeshyV6ModelType {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Standard => "standard",
      Self::LowPoly => "lowpoly",
    }
  }
}

impl MeshyV6Topology {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Quad => "quad",
      Self::Triangle => "triangle",
    }
  }
}

impl MeshyV6SymmetryMode {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Off => "off",
      Self::Auto => "auto",
      Self::On => "on",
    }
  }
}

impl MeshyV6PoseMode {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::APose => "a-pose",
      Self::TPose => "t-pose",
    }
  }
}

impl FalEndpoint for MeshyV6TextToMeshRequest {
  const ENDPOINT: &str = "fal-ai/meshy/v6/text-to-3d";

  type RawRequest = MeshyV6TextToMeshInput;
  type RawResponse = MeshyV6TextToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      mode: self.mode.map(|m| m.to_str().to_string()),
      seed: self.seed,
      model_type: self.model_type.map(|m| m.to_str().to_string()),
      topology: self.topology.map(|t| t.to_str().to_string()),
      target_polycount: self.target_polycount,
      should_remesh: self.should_remesh,
      symmetry_mode: self.symmetry_mode.map(|s| s.to_str().to_string()),
      enable_pbr: self.enable_pbr,
      pose_mode: self.pose_mode.map(|p| p.to_str().to_string()),
      enable_prompt_expansion: self.enable_prompt_expansion,
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

  fn base_request() -> MeshyV6TextToMeshRequest {
    MeshyV6TextToMeshRequest {
      prompt: "a small ceramic teapot".to_string(),
      mode: None,
      seed: None,
      model_type: None,
      topology: None,
      target_polycount: None,
      should_remesh: None,
      symmetry_mode: None,
      enable_pbr: None,
      pose_mode: None,
      enable_prompt_expansion: None,
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
  async fn test_text_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let result = base_request().send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_mesh_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let result = base_request().send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_core_fields() {
    let request = MeshyV6TextToMeshRequest {
      mode: Some(MeshyV6Mode::Preview),
      model_type: Some(MeshyV6ModelType::LowPoly),
      topology: Some(MeshyV6Topology::Quad),
      target_polycount: Some(5_000),
      symmetry_mode: Some(MeshyV6SymmetryMode::On),
      enable_pbr: Some(true),
      pose_mode: Some(MeshyV6PoseMode::TPose),
      ..base_request()
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json["mode"], "preview");
    assert_eq!(json["model_type"], "lowpoly");
    assert_eq!(json["topology"], "quad");
    assert_eq!(json["target_polycount"], 5_000);
    assert_eq!(json["symmetry_mode"], "on");
    assert_eq!(json["enable_pbr"], true);
    assert_eq!(json["pose_mode"], "t-pose");
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = MeshyV6TextToMeshRequest { prompt: "p".to_string(), ..base_request() };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "p" }));
  }

  #[test]
  fn every_symmetry_mode_maps_to_wire_string() {
    for (variant, expected) in [
      (MeshyV6SymmetryMode::Off, "off"),
      (MeshyV6SymmetryMode::Auto, "auto"),
      (MeshyV6SymmetryMode::On, "on"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn pose_modes_use_hyphenated_wire_strings() {
    assert_eq!(MeshyV6PoseMode::APose.to_str(), "a-pose");
    assert_eq!(MeshyV6PoseMode::TPose.to_str(), "t-pose");
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(MeshyV6TextToMeshRequest::ENDPOINT, "fal-ai/meshy/v6/text-to-3d");
  }

  // NB: Pricing tests are in cost.rs
}
