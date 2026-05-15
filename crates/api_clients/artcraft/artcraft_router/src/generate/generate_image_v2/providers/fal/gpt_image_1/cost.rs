use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1::request::FalGptImage1RequestState;

#[derive(Clone, Debug)]
pub struct FalGptImage1CostState {
  request: FalGptImage1RequestState,
}

impl FalGptImage1CostState {
  pub fn from_request(request: &FalGptImage1RequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_in_usd_cents = match &self.request {
      FalGptImage1RequestState::TextToImage(req) => req.calculate_cost_in_cents(),
      FalGptImage1RequestState::EditImage(req) => req.calculate_cost_in_cents(),
    };

    ImageGenerationCostEstimate {
      cost_in_credits: None,
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use fal_client::requests::api::image::edit::gpt_image_1_edit_image::api::{
    GptImage1EditImageNumImages, GptImage1EditImageQuality, GptImage1EditImageRequest,
    GptImage1EditImageSize,
  };
  use fal_client::requests::api::image::text::gpt_image_1_text_to_image::api::{
    GptImage1TextToImageNumImages, GptImage1TextToImageQuality,
    GptImage1TextToImageRequest, GptImage1TextToImageSize,
  };

  #[test]
  fn text_to_image_cost_spots() {
    let cases = [
      (
        GptImage1TextToImageNumImages::One,
        Some(GptImage1TextToImageQuality::High),
        Some(GptImage1TextToImageSize::Square),
        17,
      ),
      (
        GptImage1TextToImageNumImages::Three,
        Some(GptImage1TextToImageQuality::Medium),
        Some(GptImage1TextToImageSize::Horizontal),
        21,
      ),
      (
        GptImage1TextToImageNumImages::Four,
        Some(GptImage1TextToImageQuality::Low),
        Some(GptImage1TextToImageSize::Vertical),
        8,
      ),
    ];

    for (num_images, quality, image_size, expected) in cases {
      let request = FalGptImage1RequestState::TextToImage(GptImage1TextToImageRequest {
        prompt: "test".to_string(),
        num_images,
        image_size,
        quality,
        background: None,
        output_format: None,
      });
      let cost = FalGptImage1CostState::from_request(&request).estimate_cost();
      assert_eq!(cost.cost_in_usd_cents, Some(expected));
    }
  }

  #[test]
  fn edit_image_cost_spots() {
    let cases = [
      (
        GptImage1EditImageNumImages::One,
        Some(GptImage1EditImageQuality::High),
        Some(GptImage1EditImageSize::Horizontal),
        25,
      ),
      (
        GptImage1EditImageNumImages::Two,
        Some(GptImage1EditImageQuality::Medium),
        Some(GptImage1EditImageSize::Square),
        10,
      ),
      (
        GptImage1EditImageNumImages::Four,
        Some(GptImage1EditImageQuality::Low),
        Some(GptImage1EditImageSize::Auto),
        8,
      ),
    ];

    for (num_images, quality, image_size, expected) in cases {
      let request = FalGptImage1RequestState::EditImage(GptImage1EditImageRequest {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/image.png".to_string()],
        num_images,
        mask_image_url: None,
        image_size,
        quality,
        input_fidelity: None,
        background: None,
        output_format: None,
      });
      let cost = FalGptImage1CostState::from_request(&request).estimate_cost();
      assert_eq!(cost.cost_in_usd_cents, Some(expected));
    }
  }
}
