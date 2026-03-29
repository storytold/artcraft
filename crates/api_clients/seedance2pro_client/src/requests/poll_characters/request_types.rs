use serde_derive::Deserialize;

// ======================== Response ========================

// The request is a GET with query params, no request body.

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
  pub json: CharacterListJson,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(super) struct CharacterListJson {
  pub items: Vec<CharacterItemJson>,
  pub next_cursor: Option<serde_json::Value>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(super) struct CharacterItemJson {
  pub id: u64,
  pub character_id: String,
  pub name: String,
  pub description: Option<String>,
  pub avatar_url: Option<String>,
  pub result_images: Option<Vec<ResultImageJson>>,
  pub task_status: String,
  pub fail_reason: Option<String>,
  pub asset_id: Option<String>,
  pub asset_status: Option<String>,
  pub created_at: String,
}

#[derive(Deserialize, Debug)]
pub(super) struct ResultImageJson {
  pub url: String,
  #[serde(rename = "type")]
  pub image_type: Option<String>,
}
