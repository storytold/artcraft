use serde_derive::{Deserialize, Serialize};

#[derive(Serialize)]
pub (super) struct BatchRequest {
  #[serde(rename = "0")]
  pub zero: BatchRequestInner,
}

#[derive(Serialize)]
pub (super) struct BatchRequestInner {
  pub json: BatchRequestJson,
}

#[derive(Serialize)]
pub (super) struct BatchRequestJson {
  #[serde(rename = "businessType")]
  pub business_type: &'static str,
  #[serde(rename = "apiParams")]
  pub api_params: ApiParams,
}

#[derive(Serialize)]
pub (super) struct ApiParams {
  pub prompt: String,
  pub resolution: String,
  #[serde(rename = "contentMode")]
  pub content_mode: &'static str,
  pub model: &'static str,
  pub duration: String,
  pub mode: &'static str,
  #[serde(rename = "uploadedUrls", skip_serializing_if = "Option::is_none")]
  pub uploaded_urls: Option<Vec<String>>,
  #[serde(rename = "batchCount", skip_serializing_if = "Option::is_none")]
  pub batch_count: Option<u8>,
}

#[derive(Deserialize, Debug)]
pub (super) struct BatchResponseItem {
  pub result: BatchResponseResult,
}

#[derive(Deserialize, Debug)]
pub (super) struct BatchResponseResult {
  pub data: BatchResponseData,
}

#[derive(Deserialize, Debug)]
pub (super) struct BatchResponseData {
  pub json: TaskResponseJson,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub (super) struct TaskResponseJson {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
  pub violation_warning: bool,
}
