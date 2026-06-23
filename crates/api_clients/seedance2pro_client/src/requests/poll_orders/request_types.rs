use serde_derive::Deserialize;

use crate::utils::number_coercion::{
  de_opt_u32_int_or_float, de_opt_u64_int_or_float,
};

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
  #[serde(default, deserialize_with = "de_opt_u64_int_or_float")]
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

  /// `"image"` for Midjourney image-generation orders, `"video"` for video
  /// orders. `None` for older response shapes that didn't include the field.
  #[serde(default)]
  pub media_type: Option<String>,

  /// The Kinovi credits charged for the order. `None` for older response
  /// shapes that didn't include the field.
  #[serde(default, deserialize_with = "de_opt_u32_int_or_float")]
  pub total_credits: Option<u32>,
}

#[derive(Deserialize, Debug)]
pub(super) struct RawVideoResult {
  pub url: String,
  /// The API intermittently returns `null` (or omits) these dimensions, so
  /// they're optional rather than coerced to a sentinel.
  #[serde(rename = "width", default, deserialize_with = "de_opt_u32_int_or_float")]
  pub maybe_width: Option<u32>,
  #[serde(rename = "height", default, deserialize_with = "de_opt_u32_int_or_float")]
  pub maybe_height: Option<u32>,
  // pub ratio: Option<f64>,
}
