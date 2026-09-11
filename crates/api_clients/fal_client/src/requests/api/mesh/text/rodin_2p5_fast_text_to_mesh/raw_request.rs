use serde::{Deserialize, Serialize};

/// Bounding-box controlnet limiting the maximum size of the generated model.
#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct Rodin2p5FastBboxCondition {
  /// Width (x axis) dimension for the bounding box constraint.
  pub width: u32,
  /// Height (y axis) dimension for the bounding box constraint.
  pub height: u32,
  /// Length (z axis) dimension for the bounding box constraint.
  pub length: u32,
}

/// Over-the-wire input shape for `fal-ai/hyper3d/rodin/v2.5/text-to-3d/fast`.
/// fal's schema: <https://fal.ai/models/fal-ai/hyper3d/rodin/v2.5/text-to-3d/fast/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Rodin2p5FastTextToMeshInput {
  /// Text prompt describing the 3D object.
  pub prompt: String,

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

  /// Options: "Auto", "1K Quad", "4K Quad", "8K Quad", "18K Quad", "20K Quad",
  /// "2K Triangle", "4K Triangle", "8K Triangle", "10K Triangle",
  /// "20K Triangle". fal default: "Auto".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality_mesh_option: Option<String>,

  /// Options: "legacy", "extreme-low", "low", "medium", "high".
  /// fal default is tier-dependent.
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
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Rodin2p5FastTextToMeshOutput {}
