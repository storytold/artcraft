use serde::Deserialize;
use std::collections::HashMap;

#[derive(Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawResponse {
  pub media_asset_id: String,
  pub file_name: String,
  pub kind: String,
  pub extension: Option<String>,
  pub metadata: Option<HashMap<String, String>>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
}
