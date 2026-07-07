use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::image::hunyuan_3d_2p0_image_to_mesh::raw_request::{
  Hunyuan3d2p0ImageToMeshInput, Hunyuan3d2p0ImageToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hunyuan3D 2.0 image-to-3D: turns a single image into a 3D mesh,
/// optionally textured.
#[derive(Clone, Debug)]
pub struct Hunyuan3d2p0ImageToMeshRequest {
  /// URL of the input image.
  pub image_url: String,

  /// Whether to generate a textured mesh instead of a white (untextured)
  /// mesh. fal's default is false when `None`. Textured costs 3x.
  pub textured_mesh: Option<bool>,

  /// Guidance scale for the model. fal's default is 7.5 when `None`.
  pub guidance_scale: Option<f64>,

  /// Number of inference steps. fal's default is 50 when `None`.
  pub num_inference_steps: Option<i64>,

  /// Octree resolution for the mesh. fal's default is 256 when `None`.
  pub octree_resolution: Option<i64>,

  /// Seed for reproducible generation. Random when `None`.
  pub seed: Option<i64>,
}

impl FalEndpoint for Hunyuan3d2p0ImageToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan3d/v2";

  type RawRequest = Hunyuan3d2p0ImageToMeshInput;
  type RawResponse = Hunyuan3d2p0ImageToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    Ok(Self::RawRequest {
      input_image_url: self.image_url.clone(),
      textured_mesh: self.textured_mesh,
      guidance_scale: self.guidance_scale,
      num_inference_steps: self.num_inference_steps,
      octree_resolution: self.octree_resolution,
      seed: self.seed,
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
  async fn test_image_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Hunyuan3d2p0ImageToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      textured_mesh: Some(true),
      guidance_scale: None,
      num_inference_steps: None,
      octree_resolution: None,
      seed: None,
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

    let request = Hunyuan3d2p0ImageToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      textured_mesh: Some(true),
      guidance_scale: None,
      num_inference_steps: None,
      octree_resolution: None,
      seed: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Hunyuan3d2p0ImageToMeshRequest {
      image_url: "https://example.com/image.jpg".to_string(),
      textured_mesh: Some(true),
      guidance_scale: Some(5.0),
      num_inference_steps: Some(30),
      octree_resolution: Some(512),
      seed: Some(42),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "input_image_url": "https://example.com/image.jpg",
        "textured_mesh": true,
        "guidance_scale": 5.0,
        "num_inference_steps": 30,
        "octree_resolution": 512,
        "seed": 42,
      }),
    );
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Hunyuan3d2p0ImageToMeshRequest {
      image_url: "https://example.com/image.jpg".to_string(),
      textured_mesh: None,
      guidance_scale: None,
      num_inference_steps: None,
      octree_resolution: None,
      seed: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "input_image_url": "https://example.com/image.jpg" }),
    );
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(Hunyuan3d2p0ImageToMeshRequest::ENDPOINT, "fal-ai/hunyuan3d/v2");
  }

  // NB: Pricing tests are in cost.rs
}
