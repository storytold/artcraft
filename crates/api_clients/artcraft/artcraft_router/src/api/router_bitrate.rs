use serde_derive::{Deserialize, Serialize};

/// Output bitrate levels you can specify when enqueuing a generation.
/// Not every model will use this; models that don't simply ignore it.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RouterBitrate {
  Normal,
  High,
}
