use serde::{Deserialize, Serialize};

/// Over-the-wire input shape for `fal-ai/hunyuan-3d/v3.1/smart-topology`.
/// Retopologizes a 3D mesh into a more efficient topology.
/// fal's schema: <https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/smart-topology/api>
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Hunyuan3d3p1SmartTopologyInput {
  /// URL of the input mesh. GLB or OBJ, max 200MB.
  pub input_file_url: String,

  /// Options: "glb", "obj". fal default: "glb".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub input_file_type: Option<String>,

  /// Options: "triangle" (triangles only), "quadrilateral" (mixed quads and
  /// triangles). fal default: "triangle".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub polygon_type: Option<String>,

  /// Options: "high", "medium", "low". fal default: "medium".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub face_level: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hunyuan3d3p1SmartTopologyOutput {}
