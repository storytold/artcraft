use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/hunyuan-3d/v3.1/pro/image-to-3d`.
/// fal's schema: <https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/pro/image-to-3d/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3d3p1ProImageToMeshInput {
  /// Front-view image (required). 128-5000px, max 8MB, JPG/PNG/WEBP.
  pub input_image_url: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub back_image_url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub left_image_url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub right_image_url: Option<String>,

  /// Top view (v3.1 exclusive).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub top_image_url: Option<String>,

  /// Bottom view (v3.1 exclusive).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub bottom_image_url: Option<String>,

  /// Left-front 45° view (v3.1 exclusive).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub left_front_image_url: Option<String>,

  /// Right-front 45° view (v3.1 exclusive).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub right_front_image_url: Option<String>,

  /// Options: "Normal", "Geometry" (no LowPoly on v3.1).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_type: Option<String>,

  /// Range 40000-1500000. fal default: 500000.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub face_count: Option<u32>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_pbr: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3d3p1ProImageToMeshOutput {}
