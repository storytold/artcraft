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
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
  use fal_client::requests::api::image::edit::gpt_image_1_edit_image::api::{GptImage1EditImageNumImages, GptImage1EditImageQuality, GptImage1EditImageRequest, GptImage1EditImageSize};
  use fal_client::requests::api::image::text::gpt_image_1_text_to_image::api::{GptImage1TextToImageNumImages, GptImage1TextToImageQuality, GptImage1TextToImageRequest, GptImage1TextToImageSize};

  #[test]
  fn text_to_image_cost_table_covers_quality_size_and_count() {
    for (quality, image_size, expected_by_count) in text_to_image_price_cases() {
      for (num_images, expected) in text_to_image_num_image_cases(expected_by_count) {
        let request = FalGptImage1RequestState::TextToImage(GptImage1TextToImageRequest { prompt: "test".to_string(), num_images, image_size, quality, background: None, output_format: None });
        let cost = FalGptImage1CostState::from_request(&request).estimate_cost();
        assert_standard_cost_estimate(cost, expected);
      }
    }
  }

  #[test]
  fn edit_image_cost_table_covers_quality_size_and_count() {
    for (quality, image_size, expected_by_count) in edit_image_price_cases() {
      for (num_images, expected) in edit_image_num_image_cases(expected_by_count) {
        let request = FalGptImage1RequestState::EditImage(GptImage1EditImageRequest { prompt: "test".to_string(), image_urls: vec!["https://example.com/image.png".to_string()], num_images, mask_image_url: None, image_size, quality, input_fidelity: None, background: None, output_format: None });
        let cost = FalGptImage1CostState::from_request(&request).estimate_cost();
        assert_standard_cost_estimate(cost, expected);
      }
    }
  }

  fn text_to_image_price_cases() -> [(Option<GptImage1TextToImageQuality>, Option<GptImage1TextToImageSize>, [u64; 4]); 13] {
    [
      (None, None, [5, 10, 15, 20]),
      (Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Auto), [2, 4, 6, 8]),
      (Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Square), [2, 4, 6, 8]),
      (Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Horizontal), [2, 4, 6, 8]),
      (Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Vertical), [2, 4, 6, 8]),
      (Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Auto), [5, 10, 15, 20]),
      (Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Square), [5, 10, 15, 20]),
      (Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Horizontal), [7, 14, 21, 28]),
      (Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Vertical), [7, 14, 21, 28]),
      (Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Auto), [17, 34, 51, 68]),
      (Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Square), [17, 34, 51, 68]),
      (Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Horizontal), [25, 50, 75, 100]),
      (Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Vertical), [25, 50, 75, 100]),
    ]
  }

  fn edit_image_price_cases() -> [(Option<GptImage1EditImageQuality>, Option<GptImage1EditImageSize>, [u64; 4]); 13] {
    [
      (None, None, [5, 10, 15, 20]),
      (Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Auto), [2, 4, 6, 8]),
      (Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Square), [2, 4, 6, 8]),
      (Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Horizontal), [2, 4, 6, 8]),
      (Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Vertical), [2, 4, 6, 8]),
      (Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Auto), [5, 10, 15, 20]),
      (Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Square), [5, 10, 15, 20]),
      (Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Horizontal), [7, 14, 21, 28]),
      (Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Vertical), [7, 14, 21, 28]),
      (Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Auto), [17, 34, 51, 68]),
      (Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Square), [17, 34, 51, 68]),
      (Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Horizontal), [25, 50, 75, 100]),
      (Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Vertical), [25, 50, 75, 100]),
    ]
  }

  fn text_to_image_num_image_cases(expected_by_count: [u64; 4]) -> [(GptImage1TextToImageNumImages, u64); 4] {
    [(GptImage1TextToImageNumImages::One, expected_by_count[0]), (GptImage1TextToImageNumImages::Two, expected_by_count[1]), (GptImage1TextToImageNumImages::Three, expected_by_count[2]), (GptImage1TextToImageNumImages::Four, expected_by_count[3])]
  }

  fn edit_image_num_image_cases(expected_by_count: [u64; 4]) -> [(GptImage1EditImageNumImages, u64); 4] {
    [(GptImage1EditImageNumImages::One, expected_by_count[0]), (GptImage1EditImageNumImages::Two, expected_by_count[1]), (GptImage1EditImageNumImages::Three, expected_by_count[2]), (GptImage1EditImageNumImages::Four, expected_by_count[3])]
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
