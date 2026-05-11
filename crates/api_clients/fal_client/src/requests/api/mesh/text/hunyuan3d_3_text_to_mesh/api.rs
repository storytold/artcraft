use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::text::hunyuan3d_3_text_to_mesh::raw_request::{
  Hunyuan3d3TextToMeshInput, Hunyuan3d3TextToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct Hunyuan3d3TextToMeshRequest {
  /// Text prompt describing the 3D object to generate.
  pub prompt: String,

  /// Target face count for the output mesh.
  pub face_count: Option<u32>,

  /// Generation type.
  pub generate_type: Option<Hunyuan3d3TextToMeshGenerateType>,

  /// Polygon type for the output mesh.
  pub polygon_type: Option<Hunyuan3d3TextToMeshPolygonType>,

  /// Whether to enable PBR (physically-based rendering) materials.
  pub enable_pbr: Option<bool>,
}

#[derive(Copy, Clone, Debug)]
pub enum Hunyuan3d3TextToMeshGenerateType {
  Normal,
  LowPoly,
  Geometry,
}

#[derive(Copy, Clone, Debug)]
pub enum Hunyuan3d3TextToMeshPolygonType {
  Triangle,
  Quadrilateral,
}

impl FalEndpoint for Hunyuan3d3TextToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan3d-v3/text-to-3d";

  type RawRequest = Hunyuan3d3TextToMeshInput;
  type RawResponse = Hunyuan3d3TextToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let generate_type = self.generate_type.map(|t| match t {
      Hunyuan3d3TextToMeshGenerateType::Normal => "Normal",
      Hunyuan3d3TextToMeshGenerateType::LowPoly => "LowPoly",
      Hunyuan3d3TextToMeshGenerateType::Geometry => "Geometry",
    }.to_string());

    let polygon_type = self.polygon_type.map(|t| match t {
      Hunyuan3d3TextToMeshPolygonType::Triangle => "triangle",
      Hunyuan3d3TextToMeshPolygonType::Quadrilateral => "quadrilateral",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
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

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_mesh_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Hunyuan3d3TextToMeshRequest {
      prompt: "A velociraptor with an open mouth full of sharp teeth. Large claws, ready to strike.".to_string(),
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
  async fn test_text_to_mesh_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = Hunyuan3d3TextToMeshRequest {
      prompt: "A velociraptor with an open mouth full of sharp teeth. Large claws, ready to strike.".to_string(),
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
