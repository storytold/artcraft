use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub(crate) struct RawRequest {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub page_size: Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub page_token: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub status: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub tags: Option<Vec<String>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub is_public: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub created_after: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub created_before: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub sort_by: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct RawResponse {
  pub worlds: Vec<RawWorldSummary>,
  pub next_page_token: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct RawWorldSummary {
  pub world_id: String,
  pub display_name: Option<String>,
  pub world_marble_url: Option<String>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub model: Option<String>,
  pub status: Option<String>,
  pub tags: Option<Vec<String>>,
}
