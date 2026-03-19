use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3dV3TextTo3dInput {
  pub prompt: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub face_count: Option<u32>,

  /// Options: "Normal", "LowPoly", "Geometry"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_type: Option<String>,

  /// Options: "triangle", "quadrilateral"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub polygon_type: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_pbr: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3dV3TextTo3dOutput {}

pub fn hunyuan3d_v3_text_to_3d(
  params: Hunyuan3dV3TextTo3dInput,
) -> FalRequest<Hunyuan3dV3TextTo3dInput, Hunyuan3dV3TextTo3dOutput> {
  FalRequest::new("fal-ai/hunyuan3d-v3/text-to-3d", params)
}
