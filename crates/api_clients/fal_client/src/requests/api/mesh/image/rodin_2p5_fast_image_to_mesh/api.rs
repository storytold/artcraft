use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::image::rodin_2p5_fast_image_to_mesh::raw_request::{
  Rodin2p5FastImageToMeshInput, Rodin2p5FastImageToMeshOutput,
};
use crate::requests::api::mesh::text::rodin_2p5_fast_text_to_mesh::api::{
  Rodin2p5FastGeometryFileFormat, Rodin2p5FastMaterial, Rodin2p5FastQualityMeshOption,
  Rodin2p5FastTextureMode, Rodin2p5FastTier,
};
use crate::requests::api::mesh::text::rodin_2p5_fast_text_to_mesh::raw_request::Rodin2p5FastBboxCondition;
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hyper3D Rodin v2.5 Fast image-to-3D. Shares its option enums with the
/// text binding.
#[derive(Clone, Debug)]
pub struct Rodin2p5FastImageToMeshRequest {
  /// Up to 5 input images of the object.
  pub image_urls: Vec<String>,

  /// Optional guidance prompt. Auto-generated from the images when `None`.
  pub prompt: Option<String>,

  /// Preserve the transparency channel of the input. fal's default is false.
  pub use_original_alpha: Option<bool>,

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

  /// Generate a preview render image. fal's default is false when `None`.
  pub preview_render: Option<bool>,
}

impl FalEndpoint for Rodin2p5FastImageToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hyper3d/rodin/v2.5/fast";

  type RawRequest = Rodin2p5FastImageToMeshInput;
  type RawResponse = Rodin2p5FastImageToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      image_urls: self.image_urls.clone(),
      prompt: self.prompt.clone(),
      use_original_alpha: self.use_original_alpha,
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
      preview_render: self.preview_render,
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

  fn base_request() -> Rodin2p5FastImageToMeshRequest {
    Rodin2p5FastImageToMeshRequest {
      image_urls: vec!["https://example.com/input.jpg".to_string()],
      prompt: None,
      use_original_alpha: None,
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
      preview_render: None,
    }
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Rodin2p5FastImageToMeshRequest {
      image_urls: vec![ERNEST_SCARED_STUPID_IMAGE_URL.to_string()],
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
    let request = Rodin2p5FastImageToMeshRequest {
      image_urls: vec![ERNEST_SCARED_STUPID_IMAGE_URL.to_string()],
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
    let request = Rodin2p5FastImageToMeshRequest {
      prompt: Some("a robot".to_string()),
      use_original_alpha: Some(true),
      tier: Some(Rodin2p5FastTier::Minimum),
      quality_mesh_option: Some(Rodin2p5FastQualityMeshOption::Triangle20k),
      ta_pose: Some(true),
      preview_render: Some(true),
      ..base_request()
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json["image_urls"], serde_json::json!(["https://example.com/input.jpg"]));
    assert_eq!(json["prompt"], "a robot");
    assert_eq!(json["use_original_alpha"], true);
    assert_eq!(json["tier"], "Gen-2.5-Minimum");
    assert_eq!(json["quality_mesh_option"], "20K Triangle");
    assert_eq!(json["TAPose"], true);
    assert_eq!(json["preview_render"], true);
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let json = serde_json::to_value(base_request().to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "image_urls": ["https://example.com/input.jpg"] }),
    );
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Rodin2p5FastImageToMeshRequest::ENDPOINT, "fal-ai/hyper3d/rodin/v2.5/fast");
  }

  // NB: Pricing tests are in cost.rs
}
