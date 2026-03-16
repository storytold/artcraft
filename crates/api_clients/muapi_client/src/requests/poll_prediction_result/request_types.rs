use serde_derive::Deserialize;

#[derive(Deserialize, Debug)]
pub(super) struct PollPredictionResultResponse {
  pub status: String,
  pub outputs: Option<Vec<String>>,
  pub error: Option<String>,
}
