use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Debug)]
pub (super) struct BatchRequest {
  #[serde(rename = "0")]
  pub zero: BatchRequestInner,
}

#[derive(Serialize, Debug)]
pub (super) struct BatchRequestInner {
  pub json: BatchRequestJson,
}

#[derive(Serialize, Debug)]
pub (super) struct BatchRequestJson {
  #[serde(rename = "businessType")]
  pub business_type: &'static str,
  #[serde(rename = "apiParams")]
  pub api_params: ApiParams,
}

#[derive(Serialize, Debug)]
pub (super) struct ApiParams {
  pub prompt: String,
  #[serde(rename = "aspectRatio")]
  pub aspect_ratio: String,
  pub resolution: &'static str,
  pub model: &'static str,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub stylize: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub chaos: Option<u8>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub weird: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality: Option<f32>,

  /// Sent as `"raw"` for raw mode; omitted otherwise. Currently `"raw"` is
  /// the only documented value.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub style: Option<&'static str>,

  /// Negative prompt. Sent as the field `"no"` to match Midjourney's
  /// CLI-style convention.
  #[serde(rename = "no", skip_serializing_if = "Option::is_none")]
  pub negative_prompt: Option<String>,

  /// Number of distinct image generations to enqueue. Omitted when 1
  /// (Midjourney returns four images per task regardless).
  #[serde(rename = "batchCount", skip_serializing_if = "Option::is_none")]
  pub batch_count: Option<u8>,

  /// Reference image URLs. When present, Midjourney uses them as visual
  /// inspiration alongside the prompt.
  #[serde(rename = "uploadedUrls", skip_serializing_if = "Option::is_none")]
  pub uploaded_urls: Option<Vec<String>>,
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
