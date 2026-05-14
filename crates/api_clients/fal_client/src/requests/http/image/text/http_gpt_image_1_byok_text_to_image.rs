use crate::requests::core_api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GptImage1ByokTextToImageInput {
  pub prompt: String,

  /// "auto", "1024x1024", "1536x1024", "1024x1536"
  pub image_size: String,

  /// 1 - 4
  pub num_images: u8,

  /// "auto", "low", "medium", "high"
  pub quality: String,

  /// BYOK - caller supplies their own OpenAI API key
  pub openai_api_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GptImage1ByokTextToImageOutput {
  // Response fields parsed elsewhere
}

pub fn gpt_image_1_byok_text_to_image(
  params: GptImage1ByokTextToImageInput,
) -> FalRequest<GptImage1ByokTextToImageInput, GptImage1ByokTextToImageOutput> {
  FalRequest::new("fal-ai/gpt-image-1/text-to-image/byok", params)
}
