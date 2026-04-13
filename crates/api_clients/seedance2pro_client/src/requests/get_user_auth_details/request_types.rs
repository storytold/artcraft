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
  pub json: RawUserAuthDetails,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub(super) struct RawUserAuthDetails {
  pub email: String,
  pub credits: u64,
  pub available_credits: u64,
}
