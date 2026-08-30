use serde_derive::Deserialize;

use crate::utils::number_coercion::de_u64_int_or_float;

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
  pub json: RawUserAuthDetails,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(super) struct RawUserAuthDetails {
  pub email: String,
  #[serde(deserialize_with = "de_u64_int_or_float")]
  pub credits: u64,
  #[serde(deserialize_with = "de_u64_int_or_float")]
  pub available_credits: u64,
}
