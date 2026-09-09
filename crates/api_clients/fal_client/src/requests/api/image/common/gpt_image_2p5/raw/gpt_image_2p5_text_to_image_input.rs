use serde::{Deserialize, Serialize};
use crate::requests::api::image::common::gpt_image_2p5::raw::gpt_image_2p5_image_size_param::GptImage2p5ImageSizeParam;

/// Wire shape for `openai/gpt-image-2.5/{flare,sunburst}/text-to-image`.
#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage2p5TextToImageInput {
  /// 1 to 32,000 characters.
  pub prompt: String,

  /// square_hd, square, portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9, auto
  /// OR a custom { width, height } object.
  /// Default: "landscape_4_3"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<GptImage2p5ImageSizeParam>,

  /// "auto", "transparent", "opaque"
  /// Default: "auto"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub background: Option<String>,

  /// "auto", "low", "medium", "high", "xhigh", "max"
  /// Default: "high"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality: Option<String>,

  /// 1 - 10
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// "jpeg", "png", "webp"
  /// Default: "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,

  /// 0 - 100. Only honoured for "jpeg" and "webp".
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_compression: Option<u8>,
}
