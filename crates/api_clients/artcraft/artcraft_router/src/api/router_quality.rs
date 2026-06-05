use serde_derive::{Deserialize, Serialize};

/// Common quality levels you can specify when enqueuing a generation.
/// Not every model will use this; models that don't simply ignore it.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RouterQuality {
  High,
  Medium,
  Low,
}
