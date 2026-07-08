use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `tripo3d/h3.1/image-to-3d`.
/// fal's schema: <https://fal.ai/models/tripo3d/h3.1/image-to-3d/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Tripo3dH3p1ImageToMeshInput {
  /// URL of the input image.
  pub image_url: String,

  /// Range 1000-2000000. Adaptive when omitted.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub face_limit: Option<u32>,

  /// Enable texture generation. fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub texture: Option<bool>,

  /// Enable PBR materials (implies texture). fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub pbr: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub model_seed: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub texture_seed: Option<i64>,

  /// Options: "standard", "detailed". fal default: "standard".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub texture_quality: Option<String>,

  /// Options: "standard", "detailed". fal default: "standard".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub geometry_quality: Option<String>,

  /// Options: "original_image", "geometry". fal default: "original_image".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub texture_alignment: Option<String>,

  /// Auto-scale the model to real-world dimensions (meters). fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub auto_size: Option<bool>,

  /// Options: "default", "align_image". fal default: "default".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub orientation: Option<String>,

  /// Generate quad mesh topology instead of triangles. fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quad: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Tripo3dH3p1ImageToMeshOutput {}
