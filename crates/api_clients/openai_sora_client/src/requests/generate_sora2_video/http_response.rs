use crate::requests::common::task_id::TaskId;
use serde_derive::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub (super) struct HttpCreateResponse {
  pub id: TaskId,
  // NB: Ignoring other fields, like "priority".
}
