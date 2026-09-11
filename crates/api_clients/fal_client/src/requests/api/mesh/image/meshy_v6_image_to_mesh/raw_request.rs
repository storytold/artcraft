use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/meshy/v6/image-to-3d`.
/// fal's schema: <https://fal.ai/models/fal-ai/meshy/v6/image-to-3d/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MeshyV6ImageToMeshInput {
  /// URL of the input image (.jpg/.jpeg/.png/AVIF/HEIF).
  pub image_url: String,

  /// Options: "standard", "lowpoly". fal default: "standard".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model_type: Option<String>,

  /// Options: "quad", "triangle". fal default: "triangle".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub topology: Option<String>,

  /// Range 100-300000. fal default: 30000.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub target_polycount: Option<u32>,

  /// Options: "off", "auto", "on". fal default: "auto".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub symmetry_mode: Option<String>,

  /// fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub should_remesh: Option<bool>,

  /// fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub should_texture: Option<bool>,

  /// fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_pbr: Option<bool>,

  /// Options: "a-pose", "t-pose". fal default: "" (unspecified).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub pose_mode: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub texture_prompt: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub texture_image_url: Option<String>,

  /// fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_rigging: Option<bool>,

  /// fal default: 1.7.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub rigging_height_meters: Option<f32>,

  /// fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_animation: Option<bool>,

  /// Range 0-696. fal default: 92.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub animation_action_id: Option<u32>,

  /// fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MeshyV6ImageToMeshOutput {}
