use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::text::tripo3d_h3p1_text_to_mesh::raw_request::{
  Tripo3dH3p1TextToMeshInput, Tripo3dH3p1TextToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Tripo3D H3.1 text-to-3D.
#[derive(Clone, Debug)]
pub struct Tripo3dH3p1TextToMeshRequest {
  /// Text prompt describing the 3D object (max 1024 characters).
  pub prompt: String,

  /// Features to avoid in the generated model.
  pub negative_prompt: Option<String>,

  /// Maximum face count. Range 1000-2000000; adaptive when `None`.
  pub face_limit: Option<u32>,

  /// Enable texture generation. fal's default is true when `None`.
  /// Disabling drops to the cheaper no-texture price tier.
  pub texture: Option<bool>,

  /// Enable PBR materials (implies texture). fal's default is true when `None`.
  pub pbr: Option<bool>,

  /// Seed for geometry reproducibility.
  pub model_seed: Option<i64>,

  /// Seed for the internal text-to-image step.
  pub image_seed: Option<i64>,

  /// Seed for texture reproducibility.
  pub texture_seed: Option<i64>,

  /// Texture quality. `Detailed` bills at the HD-texture price tier.
  /// fal's default is `Standard` when `None`.
  pub texture_quality: Option<Tripo3dH3p1TextureQuality>,

  /// Geometry quality. `Detailed` adds cost. fal's default is `Standard`.
  pub geometry_quality: Option<Tripo3dH3p1GeometryQuality>,

  /// Auto-scale the model to real-world dimensions (meters). fal default: false.
  pub auto_size: Option<bool>,

  /// Generate quad mesh topology instead of triangles (returns FBX).
  /// Adds cost. fal's default is false when `None`.
  pub quad: Option<bool>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Tripo3dH3p1TextureQuality {
  Standard,
  Detailed,
}

impl Tripo3dH3p1TextureQuality {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Standard => "standard",
      Self::Detailed => "detailed",
    }
  }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Tripo3dH3p1GeometryQuality {
  Standard,
  Detailed,
}

impl Tripo3dH3p1GeometryQuality {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      Self::Standard => "standard",
      Self::Detailed => "detailed",
    }
  }
}

impl FalEndpoint for Tripo3dH3p1TextToMeshRequest {
  const ENDPOINT: &str = "tripo3d/h3.1/text-to-3d";

  type RawRequest = Tripo3dH3p1TextToMeshInput;
  type RawResponse = Tripo3dH3p1TextToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      negative_prompt: self.negative_prompt.clone(),
      face_limit: self.face_limit,
      texture: self.texture,
      pbr: self.pbr,
      model_seed: self.model_seed,
      image_seed: self.image_seed,
      texture_seed: self.texture_seed,
      texture_quality: self.texture_quality.map(|q| q.to_str().to_string()),
      geometry_quality: self.geometry_quality.map(|q| q.to_str().to_string()),
      auto_size: self.auto_size,
      quad: self.quad,
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

  fn base_request() -> Tripo3dH3p1TextToMeshRequest {
    Tripo3dH3p1TextToMeshRequest {
      prompt: "a small ceramic teapot".to_string(),
      negative_prompt: None,
      face_limit: None,
      texture: None,
      pbr: None,
      model_seed: None,
      image_seed: None,
      texture_seed: None,
      texture_quality: None,
      geometry_quality: None,
      auto_size: None,
      quad: None,
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
  fn raw_request_maps_all_fields() {
    let request = Tripo3dH3p1TextToMeshRequest {
      prompt: "p".to_string(),
      negative_prompt: Some("blurry".to_string()),
      face_limit: Some(50_000),
      texture: Some(true),
      pbr: Some(false),
      model_seed: Some(1),
      image_seed: Some(2),
      texture_seed: Some(3),
      texture_quality: Some(Tripo3dH3p1TextureQuality::Detailed),
      geometry_quality: Some(Tripo3dH3p1GeometryQuality::Detailed),
      auto_size: Some(true),
      quad: Some(true),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "prompt": "p",
        "negative_prompt": "blurry",
        "face_limit": 50_000,
        "texture": true,
        "pbr": false,
        "model_seed": 1,
        "image_seed": 2,
        "texture_seed": 3,
        "texture_quality": "detailed",
        "geometry_quality": "detailed",
        "auto_size": true,
        "quad": true,
      }),
    );
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Tripo3dH3p1TextToMeshRequest { prompt: "p".to_string(), ..base_request() };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "p" }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Tripo3dH3p1TextToMeshRequest::ENDPOINT, "tripo3d/h3.1/text-to-3d");
  }

  // NB: Pricing tests are in cost.rs
}
