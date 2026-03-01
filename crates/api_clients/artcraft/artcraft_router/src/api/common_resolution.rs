use serde_derive::{Deserialize, Serialize};

/// This is a comprehensive list of common resolutions you can specify when enqueuing a generation.
/// Not every model will support every resolution.
/// In the case a model doesn't support the resolution, gracefully pick the nearest option.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommonResolution {
  /// Models: Nano Banana Pro
  OneK,
  /// Models: Nano Banana Pro
  TwoK,
  /// Models: (None)
  ThreeK,
  /// Models: Nano Banana Pro
  FourK,
}
