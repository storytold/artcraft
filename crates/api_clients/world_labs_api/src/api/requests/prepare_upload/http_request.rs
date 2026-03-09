use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize)]
pub(crate) struct RawRequest {
  pub file_name: String,
  pub kind: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub extension: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub metadata: Option<HashMap<String, String>>,
}

#[derive(Deserialize)]
pub(crate) struct RawResponse {
  pub media_asset: RawMediaAsset,
  pub upload_info: RawUploadInfo,
}

#[derive(Deserialize)]
#[allow(dead_code)]
pub(crate) struct RawMediaAsset {
  pub media_asset_id: String,
  pub file_name: String,
  pub kind: String,
  pub extension: Option<String>,
}

#[derive(Deserialize)]
pub(crate) struct RawUploadInfo {
  pub upload_url: String,
  pub upload_method: String,
  pub required_headers: Option<HashMap<String, String>>,
}
