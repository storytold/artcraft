use crate::requests::core_api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

/// Non-BYOK text-to-image binding for `fal-ai/gpt-image-1/text-to-image`.
///
/// Fal hosts this model directly (no caller-supplied OpenAI API key); pricing
/// is billed by Fal at their published rates.
#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GptImage1TextToImageInput {
  pub prompt: String,

  /// "auto", "1024x1024", "1536x1024", "1024x1536"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_size: Option<String>,

  /// "low", "medium", "high"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality: Option<String>,

  /// 1 - 4
  /// Default: 1
  #[serde(skip_serializing_if = "Option::is_none")]
  pub num_images: Option<u8>,

  /// "auto", "transparent", "opaque"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub background: Option<String>,

  /// "jpeg", "png", "webp"
  /// Default: "png"
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage1TextToImageFile {
  pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage1TextToImageOutput {
  pub images: Vec<GptImage1TextToImageFile>,
}

pub fn gpt_image_1_text_to_image(
  params: GptImage1TextToImageInput,
) -> FalRequest<GptImage1TextToImageInput, GptImage1TextToImageOutput> {
  FalRequest::new("fal-ai/gpt-image-1/text-to-image", params)
}
