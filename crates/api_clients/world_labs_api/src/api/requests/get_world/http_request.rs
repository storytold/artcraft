use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub(crate) struct RawResponse {
  pub world_id: String,
  pub display_name: Option<String>,
  pub world_marble_url: Option<String>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub model: Option<String>,
  pub tags: Option<Vec<String>>,
  pub assets: Option<RawWorldAssets>,
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
pub(crate) struct RawSplats {
  pub spz_urls: Option<RawSpzUrls>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct RawSpzUrls {
  #[serde(rename = "100k")]
  pub low: Option<String>,
  #[serde(rename = "500k")]
  pub medium: Option<String>,
  pub full_res: Option<String>,
}
