use serde_derive::{Deserialize, Serialize};

/// Common image models supported by the router.
/// Not all models are available through all providers.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommonImageModel {
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "nano_banana")]
  NanaBanana,
  #[serde(rename = "nano_banana_pro")]
  NanaBananaPro,
  #[serde(rename = "seedream_4")]
  Seedream4,
  #[serde(rename = "seedream_4p5")]
  Seedream4p5,
}
