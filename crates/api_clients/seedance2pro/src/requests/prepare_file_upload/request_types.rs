use serde_derive::{Deserialize, Serialize};

#[derive(Serialize)]
pub(super) struct BatchRequest {
  #[serde(rename = "0")]
  pub zero: BatchRequestInner,
}

#[derive(Serialize)]
pub(super) struct BatchRequestInner {
  pub json: BatchRequestJson,
}

#[derive(Serialize)]
pub(super) struct BatchRequestJson {
  pub path: String,
}

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
  pub json: String,
}
