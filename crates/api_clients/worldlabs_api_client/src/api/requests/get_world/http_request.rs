use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub(crate) struct RawResponse {
  pub world_id: String,
  pub display_name: Option<String>,
  pub world_marble_url: Option<String>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub model: Option<String>,
  pub status: Option<String>,
  pub tags: Option<Vec<String>>,
  pub permission: Option<RawPermission>,
  pub assets: Option<RawWorldAssets>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawPermission {
  pub public: Option<bool>,
  pub allow_id_access: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct RawWorldAssets {
  pub caption: Option<String>,
  pub thumbnail_url: Option<String>,
  pub imagery: Option<RawImagery>,
  pub mesh: Option<RawMesh>,
  pub splats: Option<RawSplats>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct RawImagery {
  pub pano_url: Option<String>,
}

#[derive(Debug, Deserialize)]
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
pub(crate) struct RawSpzUrls {
  #[serde(rename = "100k")]
  pub low: Option<String>,
  #[serde(rename = "500k")]
  pub medium: Option<String>,
  pub full_res: Option<String>,
}
