use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::gpt_image_2::request::FalGptImage2RequestState;

#[derive(Clone, Debug)]
pub struct FalGptImage2CostState {
  request: FalGptImage2RequestState,
}

impl FalGptImage2CostState {
  pub fn from_request(request: &FalGptImage2RequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_in_usd_cents = match &self.request {
      FalGptImage2RequestState::TextToImage(req) => req.calculate_cost_in_cents(),
      FalGptImage2RequestState::EditImage(req) => req.calculate_cost_in_cents(),
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
  use fal_client::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
  use fal_client::requests::api::image::edit::gpt_image_2_edit_image::api::{
    GptImage2EditImageNumImages, GptImage2EditImageQuality, GptImage2EditImageRequest,
    GptImage2EditImageSize,
  };
  use fal_client::requests::api::image::text::gpt_image_2_text_to_image::api::{
    GptImage2TextToImageNumImages, GptImage2TextToImageQuality,
    GptImage2TextToImageRequest, GptImage2TextToImageSize,
  };

  #[test]
  fn text_to_image_cost_spots() {
    let cases = [
      (
        GptImage2TextToImageNumImages::One,
        Some(GptImage2TextToImageQuality::High),
        Some(GptImage2TextToImageSize::Landscape4x3),
        Some(GptImage2Resolution::OneK),
        16,
      ),
      (
        GptImage2TextToImageNumImages::Two,
        Some(GptImage2TextToImageQuality::Medium),
        Some(GptImage2TextToImageSize::Landscape16x9),
        Some(GptImage2Resolution::TwoK),
        11,
      ),
      (
        GptImage2TextToImageNumImages::Four,
        Some(GptImage2TextToImageQuality::Low),
        Some(GptImage2TextToImageSize::Square),
        Some(GptImage2Resolution::FourK),
        10,
      ),
    ];

    for (num_images, quality, image_size, resolution, expected) in cases {
      let request = FalGptImage2RequestState::TextToImage(GptImage2TextToImageRequest {
        prompt: "test".to_string(),
        num_images,
        image_size,
        resolution,
        quality,
        output_format: None,
      });
      let cost = FalGptImage2CostState::from_request(&request).estimate_cost();
      assert_eq!(cost.cost_in_usd_cents, Some(expected));
    }
  }

  #[test]
  fn edit_image_cost_spots() {
    let cases = [
      (
        GptImage2EditImageNumImages::One,
        Some(GptImage2EditImageQuality::High),
        Some(GptImage2EditImageSize::Portrait4x3),
        Some(GptImage2Resolution::TwoK),
        24,
      ),
      (
        GptImage2EditImageNumImages::Three,
        Some(GptImage2EditImageQuality::Medium),
        Some(GptImage2EditImageSize::SquareHd),
        Some(GptImage2Resolution::TwoK),
        21,
      ),
      (
        GptImage2EditImageNumImages::Four,
        Some(GptImage2EditImageQuality::Low),
        Some(GptImage2EditImageSize::Auto),
        Some(GptImage2Resolution::OneK),
        10,
      ),
    ];

    for (num_images, quality, image_size, resolution, expected) in cases {
      let request = FalGptImage2RequestState::EditImage(GptImage2EditImageRequest {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/image.png".to_string()],
        num_images,
        mask_url: None,
        image_size,
        resolution,
        quality,
        output_format: None,
      });
      let cost = FalGptImage2CostState::from_request(&request).estimate_cost();
      assert_eq!(cost.cost_in_usd_cents, Some(expected));
    }
  }
}
