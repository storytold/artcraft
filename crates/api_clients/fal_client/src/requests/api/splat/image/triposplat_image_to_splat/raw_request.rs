use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `tripo3d/triposplat` (image-to-Gaussian-splat).
/// fal's schema: <https://fal.ai/models/tripo3d/triposplat/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TripoSplatImageToSplatInput {
  /// URL of the input image.
  pub image_url: String,

  /// Number of Gaussians to generate. Range 32768-262144.
  /// fal default: 262144.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_gaussians: Option<u32>,

  /// Number of inference steps. Range 1-50. fal default: 20.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<u32>,

  /// Guidance scale. Range 0-10. fal default: 3.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f32>,

  /// Options: "ply", "splat". fal default: "ply".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  /// Seed for reproducibility. fal default: random.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  /// fal default: true.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub enable_safety_checker: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TripoSplatImageToSplatOutput {}
