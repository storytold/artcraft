use crate::requests::api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3dV3ImageTo3dInput {
  pub input_image_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub back_image_url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub left_image_url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub right_image_url: Option<String>,

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
pub struct Hunyuan3dV3ImageTo3dOutput {}

pub fn hunyuan3d_v3_image_to_3d(
  params: Hunyuan3dV3ImageTo3dInput,
) -> FalRequest<Hunyuan3dV3ImageTo3dInput, Hunyuan3dV3ImageTo3dOutput> {
  FalRequest::new("fal-ai/hunyuan3d-v3/image-to-3d", params)
}
