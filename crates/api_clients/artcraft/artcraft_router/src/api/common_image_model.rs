use serde_derive::{Deserialize, Serialize};

/// Common image models supported by the router.
/// Not all models are available through all providers.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommonImageModel {
  #[serde(rename = "nano_banana_pro")]
  NanaBananaPro,
}
