use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::mesh::topology::hunyuan_3d_3p1_smart_topology::raw_request::{
  Hunyuan3d3p1SmartTopologyInput, Hunyuan3d3p1SmartTopologyOutput,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

/// Hunyuan 3D v3.1 Smart Topology: retopologizes an existing 3D mesh into a
/// cleaner, more efficient topology.
///
/// Input constraints: GLB or OBJ, max 200MB.
#[derive(Clone, Debug)]
pub struct Hunyuan3d3p1SmartTopologyRequest {
  /// URL of the input mesh file (GLB or OBJ).
  pub input_file_url: String,

  /// Format of the input file. fal's default is `Glb` when `None`.
  pub input_file_type: Option<Hunyuan3d3p1SmartTopologyInputFileType>,

  /// Output polygon type. fal's default is `Triangle` when `None`.
  pub polygon_type: Option<Hunyuan3d3p1SmartTopologyPolygonType>,

  /// Output detail level. fal's default is `Medium` when `None`.
  pub face_level: Option<Hunyuan3d3p1SmartTopologyFaceLevel>,
}

#[derive(Copy, Clone, Debug)]
pub enum Hunyuan3d3p1SmartTopologyInputFileType {
  Glb,
  Obj,
}

#[derive(Copy, Clone, Debug)]
pub enum Hunyuan3d3p1SmartTopologyPolygonType {
  Triangle,
  Quadrilateral,
}

#[derive(Copy, Clone, Debug)]
pub enum Hunyuan3d3p1SmartTopologyFaceLevel {
  High,
  Medium,
  Low,
}

impl FalEndpoint for Hunyuan3d3p1SmartTopologyRequest {
  const ENDPOINT: &str = "fal-ai/hunyuan-3d/v3.1/smart-topology";

  type RawRequest = Hunyuan3d3p1SmartTopologyInput;
  type RawResponse = Hunyuan3d3p1SmartTopologyOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let input_file_type = self.input_file_type.map(|t| match t {
      Hunyuan3d3p1SmartTopologyInputFileType::Glb => "glb",
      Hunyuan3d3p1SmartTopologyInputFileType::Obj => "obj",
    }.to_string());

    let polygon_type = self.polygon_type.map(|t| match t {
      Hunyuan3d3p1SmartTopologyPolygonType::Triangle => "triangle",
      Hunyuan3d3p1SmartTopologyPolygonType::Quadrilateral => "quadrilateral",
    }.to_string());

    let face_level = self.face_level.map(|l| match l {
      Hunyuan3d3p1SmartTopologyFaceLevel::High => "high",
      Hunyuan3d3p1SmartTopologyFaceLevel::Medium => "medium",
      Hunyuan3d3p1SmartTopologyFaceLevel::Low => "low",
    }.to_string());

    Ok(Self::RawRequest {
      input_file_url: self.input_file_url.clone(),
      input_file_type,
      polygon_type,
      face_level,
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
  #[ignore] // manually run — fires a real API request and incurs cost; needs a real GLB URL
  async fn test_smart_topology_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1SmartTopologyRequest {
      input_file_url: "https://example.com/model.glb".to_string(),
      input_file_type: None,
      polygon_type: None,
      face_level: None,
    };
    let result = request.send_webhook_request(&api_key, "https://example.com/webhook").await?;
    println!("Webhook result: {:?}", result);
    assert!(result.request_id.is_some() || result.gateway_request_id.is_some());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost; needs a real GLB URL
  async fn test_smart_topology_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);
    let request = Hunyuan3d3p1SmartTopologyRequest {
      input_file_url: "https://example.com/model.glb".to_string(),
      input_file_type: None,
      polygon_type: None,
      face_level: None,
    };
    let result = request.send_queue_request(&api_key).await?;
    println!("Queue result — request_id: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  // ── Wire-shape sanity (no API calls) ──

  #[test]
  fn raw_request_maps_all_fields() {
    let request = Hunyuan3d3p1SmartTopologyRequest {
      input_file_url: "https://example.com/model.obj".to_string(),
      input_file_type: Some(Hunyuan3d3p1SmartTopologyInputFileType::Obj),
      polygon_type: Some(Hunyuan3d3p1SmartTopologyPolygonType::Quadrilateral),
      face_level: Some(Hunyuan3d3p1SmartTopologyFaceLevel::Low),
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({
        "input_file_url": "https://example.com/model.obj",
        "input_file_type": "obj",
        "polygon_type": "quadrilateral",
        "face_level": "low",
      }),
    );
  }

  #[test]
  fn raw_request_omits_unset_optionals() {
    let request = Hunyuan3d3p1SmartTopologyRequest {
      input_file_url: "https://example.com/model.glb".to_string(),
      input_file_type: None,
      polygon_type: None,
      face_level: None,
    };
    let json = serde_json::to_value(request.to_raw_request().unwrap()).unwrap();
    assert_eq!(
      json,
      serde_json::json!({ "input_file_url": "https://example.com/model.glb" }),
    );
  }

  #[test]
  fn every_face_level_maps_to_wire_string() {
    for (variant, expected) in [
      (Hunyuan3d3p1SmartTopologyFaceLevel::High, "high"),
      (Hunyuan3d3p1SmartTopologyFaceLevel::Medium, "medium"),
      (Hunyuan3d3p1SmartTopologyFaceLevel::Low, "low"),
    ] {
      let request = Hunyuan3d3p1SmartTopologyRequest {
        input_file_url: "https://example.com/model.glb".to_string(),
        input_file_type: None,
        polygon_type: None,
        face_level: Some(variant),
      };
      let raw = request.to_raw_request().unwrap();
      assert_eq!(raw.face_level.as_deref(), Some(expected));
    }
  }

  #[test]
  fn endpoint_path_is_canonical() {
    assert_eq!(
      Hunyuan3d3p1SmartTopologyRequest::ENDPOINT,
      "fal-ai/hunyuan-3d/v3.1/smart-topology",
    );
  }

  // NB: Pricing tests are in cost.rs
}
