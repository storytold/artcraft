use serde_derive::{Deserialize, Serialize};

/// Common splat models supported by the router.
/// Not all models are available through all providers.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommonSplatModel {
  #[serde(rename = "marble_0p1_mini")]
  Marble0p1Mini,

  #[serde(rename = "marble_0p1_plus")]
  Marble0p1Plus,
}
