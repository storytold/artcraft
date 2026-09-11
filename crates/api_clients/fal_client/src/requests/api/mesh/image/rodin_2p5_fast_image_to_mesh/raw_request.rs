use serde::{Deserialize, Serialize};

use crate::requests::api::mesh::text::rodin_2p5_fast_text_to_mesh::raw_request::Rodin2p5FastBboxCondition;

/// Over-the-wire input shape for `fal-ai/hyper3d/rodin/v2.5/fast`
/// (image-to-3D mode).
/// fal's schema: <https://fal.ai/models/fal-ai/hyper3d/rodin/v2.5/fast/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Rodin2p5FastImageToMeshInput {
  /// Up to 5 input images for image-to-3D.
  pub image_urls: Vec<String>,

  /// Optional guidance prompt. Auto-generated from images when omitted.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub prompt: Option<String>,

  /// Preserve the transparency channel of the input. fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub use_original_alpha: Option<bool>,

  /// Options: "Gen-2.5-Minimum", "Gen-2.5-Extreme-Low", "Gen-2.5-Low".
  /// fal default: "Gen-2.5-Extreme-Low".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub tier: Option<String>,

  /// Range 0-65535.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<u32>,

  /// Options: "glb", "usdz", "fbx", "obj", "stl". fal default: "glb".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub geometry_file_format: Option<String>,

  /// Options: "PBR", "Shaded", "All", "None". fal default: "Shaded".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub material: Option<String>,

  /// See the text binding for the full option list. fal default: "Auto".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality_mesh_option: Option<String>,

  /// Options: "legacy", "extreme-low", "low", "medium", "high".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub texture_mode: Option<String>,

  /// fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_creative_mode: Option<bool>,

  /// Enhanced texture post-processing. fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub hd_texture: Option<bool>,

  /// Removes baked lighting from textures. fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub texture_delight: Option<bool>,

  /// Finer geometric detail. fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub is_micro: Option<bool>,

  /// Generate in T/A-pose for rigging/animation. fal default: false.
  /// NB: fal's field name is literally "TAPose".
  #[serde(rename = "TAPose", skip_serializing_if = "Option::is_none")]
  pub ta_pose: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub bbox_condition: Option<Rodin2p5FastBboxCondition>,

  /// Generate a preview render image. fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub preview_render: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Rodin2p5FastImageToMeshOutput {}
