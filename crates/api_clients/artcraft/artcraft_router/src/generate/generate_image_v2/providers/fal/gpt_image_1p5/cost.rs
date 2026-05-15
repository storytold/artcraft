use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1p5::request::FalGptImage1p5RequestState;

#[derive(Clone, Debug)]
pub struct FalGptImage1p5CostState {
  request: FalGptImage1p5RequestState,
}

impl FalGptImage1p5CostState {
  pub fn from_request(request: &FalGptImage1p5RequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_in_usd_cents = match &self.request {
      FalGptImage1p5RequestState::TextToImage(req) => req.calculate_cost_in_cents(),
      FalGptImage1p5RequestState::EditImage(req) => req.calculate_cost_in_cents(),
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
  use fal_client::requests::api::image::edit::gpt_image_1p5_edit_image::api::{
    GptImage1p5EditImageNumImages, GptImage1p5EditImageQuality,
    GptImage1p5EditImageRequest, GptImage1p5EditImageSize,
  };
  use fal_client::requests::api::image::text::gpt_image_1p5_text_to_image::api::{
    GptImage1p5TextToImageNumImages, GptImage1p5TextToImageQuality,
    GptImage1p5TextToImageRequest, GptImage1p5TextToImageSize,
  };

  #[test]
  fn text_to_image_cost_spots() {
    let cases = [
      (
        GptImage1p5TextToImageNumImages::One,
        Some(GptImage1p5TextToImageQuality::High),
        Some(GptImage1p5TextToImageSize::Square),
        13,
      ),
      (
        GptImage1p5TextToImageNumImages::Three,
        Some(GptImage1p5TextToImageQuality::Medium),
        Some(GptImage1p5TextToImageSize::Wide),
        15,
      ),
      (
        GptImage1p5TextToImageNumImages::Four,
        Some(GptImage1p5TextToImageQuality::Low),
        Some(GptImage1p5TextToImageSize::Tall),
        4,
      ),
    ];

    for (num_images, quality, image_size, expected) in cases {
      let request = FalGptImage1p5RequestState::TextToImage(GptImage1p5TextToImageRequest {
        prompt: "test".to_string(),
        num_images,
        image_size,
        background: None,
        quality,
        output_format: None,
      });
      let cost = FalGptImage1p5CostState::from_request(&request).estimate_cost();
      assert_eq!(cost.cost_in_usd_cents, Some(expected));
    }
  }

  #[test]
  fn edit_image_cost_spots() {
    let cases = [
      (
        GptImage1p5EditImageNumImages::One,
        Some(GptImage1p5EditImageQuality::High),
        Some(GptImage1p5EditImageSize::Wide),
        20,
      ),
      (
        GptImage1p5EditImageNumImages::Two,
        Some(GptImage1p5EditImageQuality::Medium),
        Some(GptImage1p5EditImageSize::Square),
        6,
      ),
      (
        GptImage1p5EditImageNumImages::Four,
        Some(GptImage1p5EditImageQuality::Low),
        Some(GptImage1p5EditImageSize::Tall),
        4,
      ),
    ];

    for (num_images, quality, image_size, expected) in cases {
      let request = FalGptImage1p5RequestState::EditImage(GptImage1p5EditImageRequest {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/image.png".to_string()],
        num_images,
        mask_image_url: None,
        image_size,
        background: None,
        quality,
        input_fidelity: None,
        output_format: None,
      });
      let cost = FalGptImage1p5CostState::from_request(&request).estimate_cost();
      assert_eq!(cost.cost_in_usd_cents, Some(expected));
    }
  }
}
