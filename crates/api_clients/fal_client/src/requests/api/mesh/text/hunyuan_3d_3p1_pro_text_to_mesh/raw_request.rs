use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/hunyuan-3d/v3.1/pro/text-to-3d`.
/// fal's schema: <https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/pro/text-to-3d/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3d3p1ProTextToMeshInput {
  /// Text prompt (max 1024 UTF-8 characters).
  pub prompt: String,

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
pub struct Hunyuan3d3p1ProTextToMeshOutput {}
