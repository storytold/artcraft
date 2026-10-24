//! Reads the `model_glb` key of a fal result (3D mesh models return a GLB file here).

use serde::Deserialize;
use serde_json::Value;

/// A 3D model file in GLB (binary glTF) format. Every field is optional.
#[derive(Debug, Clone, Deserialize)]
pub struct PollResponseModelGlbData {
  /// Where to download the model.
  pub url: Option<String>,
  /// MIME type, e.g. "model/gltf-binary".
  pub content_type: Option<String>,
  /// File name chosen by fal.
  pub file_name: Option<String>,
  /// Size in bytes.
  pub file_size: Option<u64>,
}

/// Returns the `model_glb` object from `value`, or `None` if absent or not shaped like a file.
pub fn extract_model_glb(value: &Value) -> Option<PollResponseModelGlbData> {
  let model_glb = value.get("model_glb")?;
  serde_json::from_value(model_glb.clone()).ok()
}
