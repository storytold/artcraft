use crate::requests::core_api::fal_request::FalRequest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GptImage1ByokEditImageInput {
  pub prompt: String,

  pub image_urls: Vec<String>,

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
pub struct GptImage1ByokEditImageOutput {
  // Response fields parsed elsewhere
}

pub fn gpt_image_1_byok_edit_image(
  params: GptImage1ByokEditImageInput,
) -> FalRequest<GptImage1ByokEditImageInput, GptImage1ByokEditImageOutput> {
  FalRequest::new("fal-ai/gpt-image-1/edit-image/byok", params)
}
