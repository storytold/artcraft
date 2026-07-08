use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/hunyuan-3d/v3.1/part`.
/// Splits a 3D mesh into semantically meaningful parts.
/// fal's schema: <https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/part/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3d3p1PartInput {
  /// URL of the input mesh. FBX only, max 100MB, face count ≤ 30,000.
  pub input_file_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3d3p1PartOutput {}
