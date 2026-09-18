use serde_derive::{Deserialize, Serialize};

/// Common quality levels you can specify when enqueuing a generation.
/// Not every model will use this; models that don't simply ignore it, and models that only
/// offer a subset of tiers clamp to the nearest tier they support.
///
/// Serialized names mirror the server's `CommonQuality` so the two convert via serde.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RouterQuality {
  /// Let the model choose. Models without a native "auto" use their default tier.
  Auto,
  /// Highest tier (GPT Image 2.5 `max`).
  Max,
  /// Between High and Max (GPT Image 2.5 `xhigh`).
  #[serde(rename = "xhigh")]
  XHigh,
  High,
  Medium,
  Low,
}
