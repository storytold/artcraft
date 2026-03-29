use serde_derive::{Deserialize, Serialize};

// ======================== Request ========================

#[derive(Serialize, Debug)]
pub(super) struct BatchRequest {
  #[serde(rename = "0")]
  pub zero: BatchRequestInner,
}

#[derive(Serialize, Debug)]
pub(super) struct BatchRequestInner {
  pub json: BatchRequestJson,
}

#[derive(Serialize, Debug)]
pub(super) struct BatchRequestJson {
  pub name: String,
  pub description: String,
  #[serde(rename = "referenceImageUrls")]
  pub reference_image_urls: Vec<String>,
  pub mode: &'static str,
  #[serde(rename = "isPublic")]
  pub is_public: bool,
}

// ======================== Response ========================

#[derive(Deserialize, Debug)]
pub(super) struct BatchResponseItem {
  pub result: BatchResponseResult,
}

#[derive(Deserialize, Debug)]
pub(super) struct BatchResponseResult {
  pub data: BatchResponseData,
}

#[derive(Deserialize, Debug)]
pub(super) struct BatchResponseData {
  pub json: CharacterResponseJson,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(super) struct CharacterResponseJson {
  pub id: u64,
  pub character_id: String,
  pub name: String,
  pub created_at: String,
}
