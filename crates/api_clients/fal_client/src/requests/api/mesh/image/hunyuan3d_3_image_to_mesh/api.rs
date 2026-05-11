use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::image::hunyuan3d_3_image_to_mesh::raw_request::{
  Hunyuan3d3ImageToMeshInput, Hunyuan3d3ImageToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Hunyuan3d3ImageToMeshRequest {
  /// URL of the input image.
  pub image_url: String,

  /// Optional back-view image URL for multi-view generation.
  pub back_image_url: Option<String>,

  /// Optional left-view image URL for multi-view generation.
  pub left_image_url: Option<String>,

  /// Optional right-view image URL for multi-view generation.
  pub right_image_url: Option<String>,

  /// Target face count for the output mesh.
  pub face_count: Option<u32>,

  /// Generation type.
  pub generate_type: Option<Hunyuan3d3ImageToMeshGenerateType>,

  /// Polygon type for the output mesh.
  pub polygon_type: Option<Hunyuan3d3ImageToMeshPolygonType>,

  /// Whether to enable PBR (physically-based rendering) materials.
  pub enable_pbr: Option<bool>,
}

#[derive(Copy, Clone, Debug)]
pub enum Hunyuan3d3ImageToMeshGenerateType {
  Normal,
  LowPoly,
  Geometry,
}

#[derive(Copy, Clone, Debug)]
pub enum Hunyuan3d3ImageToMeshPolygonType {
  Triangle,
  Quadrilateral,
}

impl FalEndpoint for Hunyuan3d3ImageToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan3d-v3/image-to-3d";

  type RawRequest = Hunyuan3d3ImageToMeshInput;
  type RawResponse = Hunyuan3d3ImageToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let generate_type = self.generate_type.map(|t| match t {
      Hunyuan3d3ImageToMeshGenerateType::Normal => "Normal",
      Hunyuan3d3ImageToMeshGenerateType::LowPoly => "LowPoly",
      Hunyuan3d3ImageToMeshGenerateType::Geometry => "Geometry",
    }.to_string());

    let polygon_type = self.polygon_type.map(|t| match t {
      Hunyuan3d3ImageToMeshPolygonType::Triangle => "triangle",
      Hunyuan3d3ImageToMeshPolygonType::Quadrilateral => "quadrilateral",
    }.to_string());

    Ok(Self::RawRequest {
      input_image_url: self.image_url.clone(),
      back_image_url: self.back_image_url.clone(),
      left_image_url: self.left_image_url.clone(),
      right_image_url: self.right_image_url.clone(),
      face_count: self.face_count,
      generate_type,
      polygon_type,
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

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Hunyuan3d3ImageToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      back_image_url: None,
      left_image_url: None,
      right_image_url: None,
      face_count: None,
      generate_type: None,
      polygon_type: None,
      enable_pbr: None,
    };

    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_mesh_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal.api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Hunyuan3d3ImageToMeshRequest {
      image_url: ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      back_image_url: None,
      left_image_url: None,
      right_image_url: None,
      face_count: None,
      generate_type: None,
      polygon_type: None,
      enable_pbr: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // NB: Pricing tests are in cost.rs
}
