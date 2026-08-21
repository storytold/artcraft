use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::image::tripo3d_h3p1_image_to_mesh::api::{
  Tripo3dH3p1ImageGeometryQuality, Tripo3dH3p1ImageTextureQuality, Tripo3dH3p1Orientation,
  Tripo3dH3p1TextureAlignment,
};
use crate::requests::api::mesh::multiview::tripo3d_h3p1_multiview_to_mesh::raw_request::{
  Tripo3dH3p1MultiviewToMeshInput, Tripo3dH3p1MultiviewToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Tripo3D H3.1 multiview-to-3D: reconstructs a mesh from 2-4 views of the
/// same object. Shares its option enums with the single-image binding.
#[derive(Clone, Debug)]
pub struct Tripo3dH3p1MultiviewToMeshRequest {
  /// 2 to 4 image URLs of the same object from different angles.
  /// Order: [front, left, back, right].
  pub image_urls: Vec<String>,

  /// Maximum face count. Range 1000-2000000; adaptive when `None`.
  pub face_limit: Option<u32>,

  /// Enable texture generation. fal's default is true when `None`.
  /// Disabling drops to the cheaper no-texture price tier.
  pub texture: Option<bool>,

  /// Enable PBR materials (implies texture). fal's default is true when `None`.
  pub pbr: Option<bool>,

  /// Seed for geometry reproducibility.
  pub model_seed: Option<i64>,

  /// Seed for texture reproducibility.
  pub texture_seed: Option<i64>,

  /// Texture quality. `Detailed` bills at the HD-texture price tier.
  pub texture_quality: Option<Tripo3dH3p1ImageTextureQuality>,

  /// Geometry quality. `Detailed` adds cost.
  pub geometry_quality: Option<Tripo3dH3p1ImageGeometryQuality>,

  /// How textures align to the source. fal's default is `OriginalImage`.
  pub texture_alignment: Option<Tripo3dH3p1TextureAlignment>,

  /// Auto-scale the model to real-world dimensions (meters). fal default: false.
  pub auto_size: Option<bool>,

  /// Model orientation. fal's default is `Default` when `None`.
  pub orientation: Option<Tripo3dH3p1Orientation>,

  /// Generate quad mesh topology instead of triangles (returns FBX).
  /// Adds cost. fal's default is false when `None`.
  pub quad: Option<bool>,
}

impl FalEndpoint for Tripo3dH3p1MultiviewToMeshRequest {
  const ENDPOINT: &str = "tripo3d/h3.1/multiview-to-3d";

  type RawRequest = Tripo3dH3p1MultiviewToMeshInput;
  type RawResponse = Tripo3dH3p1MultiviewToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      image_urls: self.image_urls.clone(),
      face_limit: self.face_limit,
      texture: self.texture,
      pbr: self.pbr,
      model_seed: self.model_seed,
      texture_seed: self.texture_seed,
      texture_quality: self.texture_quality.map(|q| q.to_str().to_string()),
      geometry_quality: self.geometry_quality.map(|q| q.to_str().to_string()),
      texture_alignment: self.texture_alignment.map(|a| a.to_str().to_string()),
      auto_size: self.auto_size,
      orientation: self.orientation.map(|o| o.to_str().to_string()),
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
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, JUNO_AT_LAKE_IMAGE_URL};

  fn base_request() -> Tripo3dH3p1MultiviewToMeshRequest {
    Tripo3dH3p1MultiviewToMeshRequest {
      image_urls: vec![
        "https://example.com/front.jpg".to_string(),
        "https://example.com/left.jpg".to_string(),
      ],
      face_limit: None,
      texture: None,
      pbr: None,
      model_seed: None,
      texture_seed: None,
      texture_quality: None,
      geometry_quality: None,
      texture_alignment: None,
      auto_size: None,
      orientation: None,
      quad: None,
    }
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_multiview_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Tripo3dH3p1MultiviewToMeshRequest {
      image_urls: vec![
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
        JUNO_AT_LAKE_IMAGE_URL.to_string(),
      ],
      ..base_request()
    };
    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_multiview_to_mesh_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Tripo3dH3p1MultiviewToMeshRequest {
      image_urls: vec![
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
        JUNO_AT_LAKE_IMAGE_URL.to_string(),
      ],
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
    let request = Tripo3dH3p1MultiviewToMeshRequest {
      texture_quality: Some(Tripo3dH3p1ImageTextureQuality::Detailed),
      quad: Some(true),
      ..base_request()
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "image_urls": ["https://example.com/front.jpg", "https://example.com/left.jpg"],
        "texture_quality": "detailed",
        "quad": true,
      }),
    );
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let json = serde_json::to_value(base_request().to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "image_urls": ["https://example.com/front.jpg", "https://example.com/left.jpg"],
      }),
    );
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Tripo3dH3p1MultiviewToMeshRequest::ENDPOINT, "tripo3d/h3.1/multiview-to-3d");
  }

  // NB: Pricing tests are in cost.rs
}
