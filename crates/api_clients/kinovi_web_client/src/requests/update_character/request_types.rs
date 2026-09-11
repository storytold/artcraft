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
#[serde(rename_all = "camelCase")]
pub(super) struct BatchRequestJson {
  pub character_id: String,
  pub name: String,
  pub description: String,
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
  pub json: UpdateCharacterResponseJson,
}

#[derive(Deserialize, Debug)]
pub(super) struct UpdateCharacterResponseJson {
  pub success: bool,
}
