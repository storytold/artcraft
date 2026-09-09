use serde::{Deserialize, Serialize};
use crate::requests::api::image::common::gpt_image_2_resolution::CustomImageSize;

/// The `image_size` field is either a preset name (e.g. `"square"`, `"auto"`) or an explicit
/// `{ width, height }` object.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum GptImage2p5ImageSizeParam {
  Preset(String),
  Custom(CustomImageSize),
}
