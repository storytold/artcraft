use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/hunyuan-3d/v3.1/rapid/text-to-3d`.
/// fal's schema: <https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/rapid/text-to-3d/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3d3p1RapidTextToMeshInput {
  /// Text prompt (max 200 UTF-8 characters).
  pub prompt: String,

  /// Generate PBR textures (metallic, roughness, normal). fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_pbr: Option<bool>,

  /// Generate a geometry-only white model without textures. fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_geometry: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3d3p1RapidTextToMeshOutput {}
