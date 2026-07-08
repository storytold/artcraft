use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::text::hunyuan_3d_3p1_pro_text_to_mesh::raw_request::{
  Hunyuan3d3p1ProTextToMeshInput, Hunyuan3d3p1ProTextToMeshOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hunyuan 3D v3.1 Pro text-to-3D.
///
/// NB: v3.1 drops the v3 `LowPoly` generation type (only Normal/Geometry) and
/// has no `polygon_type` parameter.
#[derive(Clone, Debug)]
pub struct Hunyuan3d3p1ProTextToMeshRequest {
  /// Text prompt describing the 3D object (max 1024 UTF-8 characters).
  pub prompt: String,

  /// Generation type. fal's default is `Normal` when `None`.
  pub generate_type: Option<Hunyuan3d3p1ProTextToMeshGenerateType>,

  /// Target face count for the output mesh. Range 40000-1500000;
  /// fal's default is 500000 when `None`. Setting a custom value adds cost.
  pub face_count: Option<u32>,

  /// Whether to enable PBR (physically-based rendering) materials.
  /// fal's default is false when `None`. Enabling adds cost.
  pub enable_pbr: Option<bool>,
}

#[derive(Copy, Clone, Debug)]
pub enum Hunyuan3d3p1ProTextToMeshGenerateType {
  Normal,
  Geometry,
}

impl FalEndpoint for Hunyuan3d3p1ProTextToMeshRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan-3d/v3.1/pro/text-to-3d";

  type RawRequest = Hunyuan3d3p1ProTextToMeshInput;
  type RawResponse = Hunyuan3d3p1ProTextToMeshOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let generate_type = self.generate_type.map(|t| match t {
      Hunyuan3d3p1ProTextToMeshGenerateType::Normal => "Normal",
      Hunyuan3d3p1ProTextToMeshGenerateType::Geometry => "Geometry",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      generate_type,
      face_count: self.face_count,
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
    let request = Hunyuan3d3p1ProTextToMeshRequest {
      prompt: "a small ceramic teapot with a bamboo handle".to_string(),
      generate_type: None,
      face_count: None,
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
    let request = Hunyuan3d3p1ProTextToMeshRequest {
      prompt: "a wooden rocking chair".to_string(),
      generate_type: None,
      face_count: None,
      enable_pbr: None,
    };
    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Hunyuan3d3p1ProTextToMeshRequest {
      prompt: "p".to_string(),
      generate_type: Some(Hunyuan3d3p1ProTextToMeshGenerateType::Geometry),
      face_count: Some(100_000),
      enable_pbr: Some(true),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "prompt": "p",
        "generate_type": "Geometry",
        "face_count": 100_000,
        "enable_pbr": true,
      }),
    );
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Hunyuan3d3p1ProTextToMeshRequest {
      prompt: "p".to_string(),
      generate_type: None,
      face_count: None,
      enable_pbr: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(json, serde_json::json!({ "prompt": "p" }));
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Hunyuan3d3p1ProTextToMeshRequest::ENDPOINT,
      "fal-ai/hunyuan-3d/v3.1/pro/text-to-3d",
    );
  }

  // NB: Pricing tests are in cost.rs
}
