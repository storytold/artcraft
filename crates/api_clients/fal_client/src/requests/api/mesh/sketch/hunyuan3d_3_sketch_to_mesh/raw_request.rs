use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/hunyuan3d-v3/sketch-to-3d`.
/// fal's schema: <https://fal.ai/models/fal-ai/hunyuan3d-v3/sketch-to-3d/api>
///
/// NB: unlike the v3 image-to-3d and text-to-3d endpoints, fal's published
/// sketch-to-3d schema has no `generate_type` or `polygon_type` parameters.
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3d3SketchToMeshInput {
  /// URL of the sketch or line-art image to transform into a 3D model.
  /// Image resolution must be between 128x128 and 5000x5000 pixels.
  pub input_image_url: String,

  /// Text prompt describing the 3D content attributes such as color,
  /// category, and material.
  pub prompt: String,

  /// Target face count. Range: 40000-1500000. fal default: 500000.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub face_count: Option<u32>,

  /// Whether to enable PBR material generation. fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_pbr: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3d3SketchToMeshOutput {}
