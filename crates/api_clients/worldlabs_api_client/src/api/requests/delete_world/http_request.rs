use serde::Deserialize;

#[derive(Deserialize)]
pub(crate) struct RawResponse {
  pub world_id: String,
  pub deleted: bool,
}
