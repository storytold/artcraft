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
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
  use fal_client::requests::api::image::edit::gpt_image_1p5_edit_image::api::{GptImage1p5EditImageNumImages, GptImage1p5EditImageQuality, GptImage1p5EditImageRequest, GptImage1p5EditImageSize};
  use fal_client::requests::api::image::text::gpt_image_1p5_text_to_image::api::{GptImage1p5TextToImageNumImages, GptImage1p5TextToImageQuality, GptImage1p5TextToImageRequest, GptImage1p5TextToImageSize};

  #[test]
  fn text_to_image_cost_table_covers_quality_size_and_count() {
    for (quality, image_size, expected_by_count) in text_to_image_price_cases() {
      for (num_images, expected) in text_to_image_num_image_cases(expected_by_count) {
        let request = FalGptImage1p5RequestState::TextToImage(GptImage1p5TextToImageRequest { prompt: "test".to_string(), num_images, image_size, background: None, quality, output_format: None });
        let cost = FalGptImage1p5CostState::from_request(&request).estimate_cost();
        assert_standard_cost_estimate(cost, expected);
      }
    }
  }

  #[test]
  fn edit_image_cost_table_covers_quality_size_and_count() {
    for (quality, image_size, expected_by_count) in edit_image_price_cases() {
      for (num_images, expected) in edit_image_num_image_cases(expected_by_count) {
        let request = FalGptImage1p5RequestState::EditImage(GptImage1p5EditImageRequest { prompt: "test".to_string(), image_urls: vec!["https://example.com/image.png".to_string()], num_images, mask_image_url: None, image_size, background: None, quality, input_fidelity: None, output_format: None });
        let cost = FalGptImage1p5CostState::from_request(&request).estimate_cost();
        assert_standard_cost_estimate(cost, expected);
      }
    }
  }

  fn text_to_image_price_cases() -> [(Option<GptImage1p5TextToImageQuality>, Option<GptImage1p5TextToImageSize>, [u64; 4]); 10] {
    [(None, None, [3, 6, 9, 12]), (Some(GptImage1p5TextToImageQuality::Low), Some(GptImage1p5TextToImageSize::Square), [1, 2, 3, 4]), (Some(GptImage1p5TextToImageQuality::Low), Some(GptImage1p5TextToImageSize::Wide), [1, 2, 3, 4]), (Some(GptImage1p5TextToImageQuality::Low), Some(GptImage1p5TextToImageSize::Tall), [1, 2, 3, 4]), (Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Square), [3, 6, 9, 12]), (Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Wide), [5, 10, 15, 20]), (Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Tall), [5, 10, 15, 20]), (Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Square), [13, 26, 39, 52]), (Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Wide), [20, 40, 60, 80]), (Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Tall), [20, 40, 60, 80])]
  }

  fn edit_image_price_cases() -> [(Option<GptImage1p5EditImageQuality>, Option<GptImage1p5EditImageSize>, [u64; 4]); 10] {
    [(None, None, [3, 6, 9, 12]), (Some(GptImage1p5EditImageQuality::Low), Some(GptImage1p5EditImageSize::Square), [1, 2, 3, 4]), (Some(GptImage1p5EditImageQuality::Low), Some(GptImage1p5EditImageSize::Wide), [1, 2, 3, 4]), (Some(GptImage1p5EditImageQuality::Low), Some(GptImage1p5EditImageSize::Tall), [1, 2, 3, 4]), (Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Square), [3, 6, 9, 12]), (Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Wide), [5, 10, 15, 20]), (Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Tall), [5, 10, 15, 20]), (Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Square), [13, 26, 39, 52]), (Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Wide), [20, 40, 60, 80]), (Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Tall), [20, 40, 60, 80])]
  }

  fn text_to_image_num_image_cases(expected_by_count: [u64; 4]) -> [(GptImage1p5TextToImageNumImages, u64); 4] {
    [(GptImage1p5TextToImageNumImages::One, expected_by_count[0]), (GptImage1p5TextToImageNumImages::Two, expected_by_count[1]), (GptImage1p5TextToImageNumImages::Three, expected_by_count[2]), (GptImage1p5TextToImageNumImages::Four, expected_by_count[3])]
  }

  fn edit_image_num_image_cases(expected_by_count: [u64; 4]) -> [(GptImage1p5EditImageNumImages, u64); 4] {
    [(GptImage1p5EditImageNumImages::One, expected_by_count[0]), (GptImage1p5EditImageNumImages::Two, expected_by_count[1]), (GptImage1p5EditImageNumImages::Three, expected_by_count[2]), (GptImage1p5EditImageNumImages::Four, expected_by_count[3])]
  }

  fn assert_standard_cost_estimate(cost: ImageGenerationCostEstimate, expected_usd_cents: u64) {
    assert_eq!(cost.cost_in_usd_cents, Some(expected_usd_cents));
    assert_eq!(cost.cost_in_credits, None);
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
  }
}
