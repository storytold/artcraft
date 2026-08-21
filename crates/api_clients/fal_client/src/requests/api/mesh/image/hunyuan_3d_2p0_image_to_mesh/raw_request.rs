use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/hunyuan3d/v2`.
/// fal's schema: <https://fal.ai/models/fal-ai/hunyuan3d/v2/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3d2p0ImageToMeshInput {
  /// URL of the image to use while generating the 3D model.
  pub input_image_url: String,

  /// If true, a textured mesh is generated and the price charged is 3x
  /// that of a white (untextured) mesh. fal default: false.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub textured_mesh: Option<bool>,

  /// Guidance scale for the model. fal default: 7.5.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub guidance_scale: Option<f64>,

  /// Number of inference steps to perform. fal default: 50.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_inference_steps: Option<i64>,

  /// Octree resolution for the model. fal default: 256.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub octree_resolution: Option<i64>,

  /// The same seed and prompt given to the same model version produce the
  /// same output.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3d2p0ImageToMeshOutput {}
