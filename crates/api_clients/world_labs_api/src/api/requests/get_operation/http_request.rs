use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct RawResponse {
  pub operation_id: String,
  pub done: Option<bool>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub expires_at: Option<String>,
  pub error: Option<RawOperationError>,
  pub metadata: Option<serde_json::Value>,
  pub response: Option<RawWorld>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct RawOperationError {
  pub code: Option<i32>,
  pub message: Option<String>,
}

/// The World object embedded in `response` when the operation completes.
/// All fields are optional to tolerate partial/unexpected shapes.
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawWorld {
  pub world_id: Option<String>,
  pub display_name: Option<String>,
  pub world_marble_url: Option<String>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub model: Option<String>,
  pub status: Option<String>,
  pub tags: Option<Vec<String>>,
  pub assets: Option<RawWorldAssets>,
  pub world_prompt: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawWorldAssets {
  pub caption: Option<String>,
  pub thumbnail_url: Option<String>,
  pub imagery: Option<RawImagery>,
  pub mesh: Option<RawMesh>,
  pub splats: Option<RawSplats>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawImagery {
  pub pano_url: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawMesh {
  pub collider_mesh_url: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawSplats {
  pub spz_urls: Option<RawSpzUrls>,
  pub semantics_metadata: Option<RawSemanticsMetadata>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawSemanticsMetadata {
  pub metric_scale_factor: Option<f64>,
  pub ground_plane_offset: Option<f64>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawSpzUrls {
  #[serde(rename = "100k")]
  pub low: Option<String>,
  #[serde(rename = "500k")]
  pub medium: Option<String>,
  pub full_res: Option<String>,
}
