use serde_derive::Deserialize;

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
  pub json: OrdersResponseJson,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(super) struct OrdersResponseJson {
  pub orders: Vec<RawOrder>,
  pub next_cursor: Option<u64>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(super) struct RawOrder {
  pub order_id: String,
  pub result_url: Option<String>,
  pub task_status: String,
  pub results: Vec<RawVideoResult>,
  pub fail_reason: Option<String>,
  pub created_at: String,
}

#[derive(Deserialize, Debug)]
pub(super) struct RawVideoResult {
  pub url: String,
  pub width: u32,
  pub height: u32,
  // pub ratio: Option<f64>,
}
