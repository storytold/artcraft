use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::text::rodin_2p5_fast_text_to_mesh::raw_request::{
  Rodin2p5FastBboxCondition, Rodin2p5FastTextToMeshInput, Rodin2p5FastTextToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hyper3D Rodin v2.5 Fast text-to-3D.
#[derive(Clone, Debug)]
pub struct Rodin2p5FastTextToMeshRequest {
  /// Text prompt describing the 3D object.
  pub prompt: String,

  /// Generation tier. fal's default is `ExtremeLow` when `None`.
  pub tier: Option<Rodin2p5FastTier>,

  /// Seed for reproducibility. Range 0-65535.
  pub seed: Option<u32>,

  /// Output geometry format. fal's default is `Glb` when `None`.
  pub geometry_file_format: Option<Rodin2p5FastGeometryFileFormat>,

  /// Material type. fal's default is `Shaded` when `None`.
  pub material: Option<Rodin2p5FastMaterial>,

  /// Mesh quality/topology preset. fal's default is `Auto` when `None`.
  pub quality_mesh_option: Option<Rodin2p5FastQualityMeshOption>,

  /// Texture resolution mode. fal's default is tier-dependent when `None`.
  pub texture_mode: Option<Rodin2p5FastTextureMode>,

  /// Enhanced generative robustness. fal's default is false when `None`.
  pub enable_creative_mode: Option<bool>,

  /// Enhanced texture post-processing. fal's default is false when `None`.
  pub hd_texture: Option<bool>,

  /// Removes baked lighting from textures. fal's default is false when `None`.
  pub texture_delight: Option<bool>,

  /// Finer geometric detail. fal's default is false when `None`.
  pub is_micro: Option<bool>,

  /// Generate in T/A-pose for rigging/animation. fal's default is false.
  pub ta_pose: Option<bool>,

  /// Bounding-box controlnet limiting the maximum model size.
  pub bbox_condition: Option<Rodin2p5FastBboxCondition>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Rodin2p5FastTier {
  Minimum,
  ExtremeLow,
  Low,
}

impl Rodin2p5FastTier {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Minimum => "Gen-2.5-Minimum",
      Self::ExtremeLow => "Gen-2.5-Extreme-Low",
      Self::Low => "Gen-2.5-Low",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Rodin2p5FastGeometryFileFormat {
  Glb,
  Usdz,
  Fbx,
  Obj,
  Stl,
}

impl Rodin2p5FastGeometryFileFormat {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Glb => "glb",
      Self::Usdz => "usdz",
      Self::Fbx => "fbx",
      Self::Obj => "obj",
      Self::Stl => "stl",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Rodin2p5FastMaterial {
  Pbr,
  Shaded,
  All,
  /// No material — fal's literal "None" option.
  NoMaterial,
}

impl Rodin2p5FastMaterial {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Pbr => "PBR",
      Self::Shaded => "Shaded",
      Self::All => "All",
      Self::NoMaterial => "None",
    }
  }
}

/// Mesh quality/topology presets. Wire values contain spaces (e.g. "1K Quad").
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Rodin2p5FastQualityMeshOption {
  Auto,
  Quad1k,
  Quad4k,
  Quad8k,
  Quad18k,
  Quad20k,
  Triangle2k,
  Triangle4k,
  Triangle8k,
  Triangle10k,
  Triangle20k,
}

impl Rodin2p5FastQualityMeshOption {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Auto => "Auto",
      Self::Quad1k => "1K Quad",
      Self::Quad4k => "4K Quad",
      Self::Quad8k => "8K Quad",
      Self::Quad18k => "18K Quad",
      Self::Quad20k => "20K Quad",
      Self::Triangle2k => "2K Triangle",
      Self::Triangle4k => "4K Triangle",
      Self::Triangle8k => "8K Triangle",
      Self::Triangle10k => "10K Triangle",
      Self::Triangle20k => "20K Triangle",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Rodin2p5FastTextureMode {
  Legacy,
  ExtremeLow,
  Low,
  Medium,
  High,
}

impl Rodin2p5FastTextureMode {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Legacy => "legacy",
      Self::ExtremeLow => "extreme-low",
      Self::Low => "low",
      Self::Medium => "medium",
      Self::High => "high",
    }
  }
}

impl FalEndpoint for Rodin2p5FastTextToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hyper3d/rodin/v2.5/text-to-3d/fast";

  type RawRequest = Rodin2p5FastTextToMeshInput;
  type RawResponse = Rodin2p5FastTextToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      tier: self.tier.map(|t| t.to_str().to_string()),
      seed: self.seed,
      geometry_file_format: self.geometry_file_format.map(|f| f.to_str().to_string()),
      material: self.material.map(|m| m.to_str().to_string()),
      quality_mesh_option: self.quality_mesh_option.map(|q| q.to_str().to_string()),
      texture_mode: self.texture_mode.map(|t| t.to_str().to_string()),
      enable_creative_mode: self.enable_creative_mode,
      hd_texture: self.hd_texture,
      texture_delight: self.texture_delight,
      is_micro: self.is_micro,
      ta_pose: self.ta_pose,
      bbox_condition: self.bbox_condition.clone(),
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

  fn base_request() -> Rodin2p5FastTextToMeshRequest {
    Rodin2p5FastTextToMeshRequest {
      prompt: "a futuristic robot with sleek metallic design".to_string(),
      tier: None,
      seed: None,
      geometry_file_format: None,
      material: None,
      quality_mesh_option: None,
      texture_mode: None,
      enable_creative_mode: None,
      hd_texture: None,
      texture_delight: None,
      is_micro: None,
      ta_pose: None,
      bbox_condition: None,
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
    let request = Rodin2p5FastTextToMeshRequest {
      tier: Some(Rodin2p5FastTier::Low),
      geometry_file_format: Some(Rodin2p5FastGeometryFileFormat::Fbx),
      material: Some(Rodin2p5FastMaterial::Pbr),
      quality_mesh_option: Some(Rodin2p5FastQualityMeshOption::Quad4k),
      texture_mode: Some(Rodin2p5FastTextureMode::High),
      ta_pose: Some(true),
      bbox_condition: Some(Rodin2p5FastBboxCondition { width: 10, height: 20, length: 30 }),
      ..base_request()
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json["tier"], "Gen-2.5-Low");
    assert_eq!(json["geometry_file_format"], "fbx");
    assert_eq!(json["material"], "PBR");
    assert_eq!(json["quality_mesh_option"], "4K Quad");
    assert_eq!(json["texture_mode"], "high");
    // fal's field name is literally "TAPose".
    assert_eq!(json["TAPose"], true);
    assert!(json.get("ta_pose").is_none());
    assert_eq!(json["bbox_condition"], serde_json::json!({ "width": 10, "height": 20, "length": 30 }));
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Rodin2p5FastTextToMeshRequest {
      prompt: "p".to_string(),
      ..base_request()
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "p" }));
  }

  #[test]
  fn every_quality_mesh_option_maps_to_wire_string() {
    for (variant, expected) in [
      (Rodin2p5FastQualityMeshOption::Auto, "Auto"),
      (Rodin2p5FastQualityMeshOption::Quad1k, "1K Quad"),
      (Rodin2p5FastQualityMeshOption::Quad4k, "4K Quad"),
      (Rodin2p5FastQualityMeshOption::Quad8k, "8K Quad"),
      (Rodin2p5FastQualityMeshOption::Quad18k, "18K Quad"),
      (Rodin2p5FastQualityMeshOption::Quad20k, "20K Quad"),
      (Rodin2p5FastQualityMeshOption::Triangle2k, "2K Triangle"),
      (Rodin2p5FastQualityMeshOption::Triangle4k, "4K Triangle"),
      (Rodin2p5FastQualityMeshOption::Triangle8k, "8K Triangle"),
      (Rodin2p5FastQualityMeshOption::Triangle10k, "10K Triangle"),
      (Rodin2p5FastQualityMeshOption::Triangle20k, "20K Triangle"),
    ] {
      assert_eq!(variant.to_str(), expected);
    }
  }

  #[test]
  fn material_none_maps_to_capitalized_none() {
    assert_eq!(Rodin2p5FastMaterial::NoMaterial.to_str(), "None");
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Rodin2p5FastTextToMeshRequest::ENDPOINT,
      "fal-ai/hyper3d/rodin/v2.5/text-to-3d/fast",
    );
  }

  // NB: Pricing tests are in cost.rs
}
