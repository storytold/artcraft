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
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
  use fal_client::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
  use fal_client::requests::api::image::edit::gpt_image_2_edit_image::api::{GptImage2EditImageNumImages, GptImage2EditImageQuality, GptImage2EditImageRequest, GptImage2EditImageSize};
  use fal_client::requests::api::image::text::gpt_image_2_text_to_image::api::{GptImage2TextToImageNumImages, GptImage2TextToImageQuality, GptImage2TextToImageRequest, GptImage2TextToImageSize};

  type TextPriceCase = (Option<GptImage2TextToImageQuality>, Option<GptImage2TextToImageSize>, Option<GptImage2Resolution>, [u64; 4]);
  type EditPriceCase = (Option<GptImage2EditImageQuality>, Option<GptImage2EditImageSize>, Option<GptImage2Resolution>, [u64; 4]);

  #[test]
  fn text_to_image_cost_table_covers_quality_size_resolution_and_count() {
    for (quality, image_size, resolution, expected_by_count) in text_to_image_price_cases() {
      for (num_images, expected) in text_to_image_num_image_cases(expected_by_count) {
        let request = FalGptImage2RequestState::TextToImage(GptImage2TextToImageRequest { prompt: "test".to_string(), num_images, image_size, resolution, quality, output_format: None });
        let cost = FalGptImage2CostState::from_request(&request).estimate_cost();
        assert_standard_cost_estimate(cost, expected);
      }
    }
  }

  #[test]
  fn edit_image_cost_table_covers_quality_size_resolution_and_count() {
    for (quality, image_size, resolution, expected_by_count) in edit_image_price_cases() {
      for (num_images, expected) in edit_image_num_image_cases(expected_by_count) {
        let request = FalGptImage2RequestState::EditImage(GptImage2EditImageRequest { prompt: "test".to_string(), image_urls: vec!["https://example.com/image.png".to_string()], num_images, mask_url: None, image_size, resolution, quality, output_format: None });
        let cost = FalGptImage2CostState::from_request(&request).estimate_cost();
        assert_standard_cost_estimate(cost, expected);
      }
    }
  }

  fn text_to_image_price_cases() -> Vec<TextPriceCase> {
    let mut cases = vec![
      // Default: High quality, Square
      (None, None, None, [16, 32, 48, 64]),
      // Presets (no resolution)
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Landscape4x3), None, [1, 2, 3, 4]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Portrait4x3), None, [1, 2, 3, 4]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Square), None, [1, 2, 3, 4]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Landscape16x9), None, [2, 4, 6, 8]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Portrait16x9), None, [2, 4, 6, 8]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::SquareHd), None, [2, 4, 6, 8]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Landscape4x3), None, [5, 10, 15, 20]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Portrait4x3), None, [5, 10, 15, 20]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Square), None, [5, 10, 15, 20]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Landscape16x9), None, [6, 12, 18, 24]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Portrait16x9), None, [6, 12, 18, 24]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::SquareHd), None, [8, 16, 24, 32]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Landscape4x3), None, [15, 30, 45, 60]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Portrait4x3), None, [15, 30, 45, 60]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Square), None, [16, 32, 48, 64]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Landscape16x9), None, [20, 40, 60, 80]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Portrait16x9), None, [20, 40, 60, 80]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::SquareHd), None, [27, 54, 81, 108]),
    ];

    for (size, resolution, low, medium, high) in text_to_image_resolution_price_cases() {
      cases.push((Some(GptImage2TextToImageQuality::Low), Some(size), Some(resolution), low));
      cases.push((Some(GptImage2TextToImageQuality::Medium), Some(size), Some(resolution), medium));
      cases.push((Some(GptImage2TextToImageQuality::High), Some(size), Some(resolution), high));
    }

    cases
  }

  fn edit_image_price_cases() -> Vec<EditPriceCase> {
    let mut cases = vec![
      // Default: High quality, Square
      (None, None, None, [15, 30, 45, 60]),
      // Auto (with and without resolution — same cost, conservative max)
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Auto), None, [2, 4, 6, 8]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Auto), None, [10, 20, 30, 40]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Auto), None, [41, 82, 123, 164]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Auto), Some(GptImage2Resolution::OneK), [2, 4, 6, 8]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Auto), Some(GptImage2Resolution::OneK), [10, 20, 30, 40]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Auto), Some(GptImage2Resolution::OneK), [41, 82, 123, 164]),
      // Presets (no resolution)
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Landscape4x3), None, [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Portrait4x3), None, [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Square), None, [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Landscape16x9), None, [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Portrait16x9), None, [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::SquareHd), None, [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Landscape4x3), None, [4, 8, 12, 16]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Portrait4x3), None, [4, 8, 12, 16]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Square), None, [4, 8, 12, 16]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Landscape16x9), None, [5, 10, 15, 20]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Portrait16x9), None, [5, 10, 15, 20]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::SquareHd), None, [7, 14, 21, 28]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Landscape4x3), None, [14, 28, 42, 56]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Portrait4x3), None, [14, 28, 42, 56]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Square), None, [15, 30, 45, 60]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Landscape16x9), None, [19, 38, 57, 76]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Portrait16x9), None, [19, 38, 57, 76]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::SquareHd), None, [26, 52, 78, 104]),
    ];

    for (size, resolution, low, medium, high) in edit_image_resolution_price_cases() {
      cases.push((Some(GptImage2EditImageQuality::Low), Some(size), Some(resolution), low));
      cases.push((Some(GptImage2EditImageQuality::Medium), Some(size), Some(resolution), medium));
      cases.push((Some(GptImage2EditImageQuality::High), Some(size), Some(resolution), high));
    }

    cases
  }

  fn text_to_image_resolution_price_cases() -> Vec<(GptImage2TextToImageSize, GptImage2Resolution, [u64; 4], [u64; 4], [u64; 4])> {
    vec![
      (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::OneK, [1, 2, 3, 4], [5, 10, 15, 20], [15, 30, 45, 60]),
      (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::TwoK, [2, 4, 6, 8], [7, 14, 21, 28], [24, 48, 72, 96]),
      (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [11, 22, 33, 44], [37, 74, 111, 148]),
      (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::FourK, [3, 6, 9, 12], [12, 24, 36, 48], [41, 82, 123, 164]),
      (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::OneK, [1, 2, 3, 4], [5, 10, 15, 20], [15, 30, 45, 60]),
      (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::TwoK, [2, 4, 6, 8], [6, 12, 18, 24], [21, 42, 63, 84]),
      (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [9, 18, 27, 36], [31, 62, 93, 124]),
      (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::FourK, [3, 6, 9, 12], [12, 24, 36, 48], [42, 84, 126, 168]),
      (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::OneK, [1, 2, 3, 4], [5, 10, 15, 20], [15, 30, 45, 60]),
      (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::TwoK, [2, 4, 6, 8], [7, 14, 21, 28], [24, 48, 72, 96]),
      (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [11, 22, 33, 44], [37, 74, 111, 148]),
      (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::FourK, [3, 6, 9, 12], [12, 24, 36, 48], [41, 82, 123, 164]),
      (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::OneK, [1, 2, 3, 4], [5, 10, 15, 20], [15, 30, 45, 60]),
      (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::TwoK, [2, 4, 6, 8], [6, 12, 18, 24], [21, 42, 63, 84]),
      (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [9, 18, 27, 36], [31, 62, 93, 124]),
      (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::FourK, [3, 6, 9, 12], [12, 24, 36, 48], [42, 84, 126, 168]),
      (GptImage2TextToImageSize::Square, GptImage2Resolution::OneK, [1, 2, 3, 4], [5, 10, 15, 20], [16, 32, 48, 64]),
      (GptImage2TextToImageSize::Square, GptImage2Resolution::TwoK, [2, 4, 6, 8], [8, 16, 24, 32], [27, 54, 81, 108]),
      (GptImage2TextToImageSize::Square, GptImage2Resolution::ThreeK, [3, 6, 9, 12], [12, 24, 36, 48], [42, 84, 126, 168]),
      (GptImage2TextToImageSize::Square, GptImage2Resolution::FourK, [3, 6, 9, 12], [12, 24, 36, 48], [42, 84, 126, 168]),
      (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::OneK, [1, 2, 3, 4], [5, 10, 15, 20], [16, 32, 48, 64]),
      (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::TwoK, [2, 4, 6, 8], [8, 16, 24, 32], [27, 54, 81, 108]),
      (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::ThreeK, [3, 6, 9, 12], [12, 24, 36, 48], [42, 84, 126, 168]),
      (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::FourK, [3, 6, 9, 12], [12, 24, 36, 48], [42, 84, 126, 168]),
    ]
  }

  fn edit_image_resolution_price_cases() -> Vec<(GptImage2EditImageSize, GptImage2Resolution, [u64; 4], [u64; 4], [u64; 4])> {
    vec![
      (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::OneK, [1, 2, 3, 4], [4, 8, 12, 16], [14, 28, 42, 56]),
      (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::TwoK, [1, 2, 3, 4], [6, 12, 18, 24], [23, 46, 69, 92]),
      (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [9, 18, 27, 36], [36, 72, 108, 144]),
      (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::FourK, [2, 4, 6, 8], [10, 20, 30, 40], [40, 80, 120, 160]),
      (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::OneK, [1, 2, 3, 4], [4, 8, 12, 16], [14, 28, 42, 56]),
      (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::TwoK, [1, 2, 3, 4], [5, 10, 15, 20], [20, 40, 60, 80]),
      (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::ThreeK, [1, 2, 3, 4], [8, 16, 24, 32], [30, 60, 90, 120]),
      (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::FourK, [2, 4, 6, 8], [10, 20, 30, 40], [41, 82, 123, 164]),
      (GptImage2EditImageSize::Portrait4x3, GptImage2Resolution::OneK, [1, 2, 3, 4], [4, 8, 12, 16], [14, 28, 42, 56]),
      (GptImage2EditImageSize::Portrait4x3, GptImage2Resolution::TwoK, [1, 2, 3, 4], [6, 12, 18, 24], [23, 46, 69, 92]),
      (GptImage2EditImageSize::Portrait4x3, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [9, 18, 27, 36], [36, 72, 108, 144]),
      (GptImage2EditImageSize::Portrait4x3, GptImage2Resolution::FourK, [2, 4, 6, 8], [10, 20, 30, 40], [40, 80, 120, 160]),
      (GptImage2EditImageSize::Portrait16x9, GptImage2Resolution::OneK, [1, 2, 3, 4], [4, 8, 12, 16], [14, 28, 42, 56]),
      (GptImage2EditImageSize::Portrait16x9, GptImage2Resolution::TwoK, [1, 2, 3, 4], [5, 10, 15, 20], [20, 40, 60, 80]),
      (GptImage2EditImageSize::Portrait16x9, GptImage2Resolution::ThreeK, [1, 2, 3, 4], [8, 16, 24, 32], [30, 60, 90, 120]),
      (GptImage2EditImageSize::Portrait16x9, GptImage2Resolution::FourK, [2, 4, 6, 8], [10, 20, 30, 40], [41, 82, 123, 164]),
      (GptImage2EditImageSize::Square, GptImage2Resolution::OneK, [1, 2, 3, 4], [4, 8, 12, 16], [15, 30, 45, 60]),
      (GptImage2EditImageSize::Square, GptImage2Resolution::TwoK, [1, 2, 3, 4], [7, 14, 21, 28], [26, 52, 78, 104]),
      (GptImage2EditImageSize::Square, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [10, 20, 30, 40], [41, 82, 123, 164]),
      (GptImage2EditImageSize::Square, GptImage2Resolution::FourK, [2, 4, 6, 8], [10, 20, 30, 40], [41, 82, 123, 164]),
      (GptImage2EditImageSize::SquareHd, GptImage2Resolution::OneK, [1, 2, 3, 4], [4, 8, 12, 16], [15, 30, 45, 60]),
      (GptImage2EditImageSize::SquareHd, GptImage2Resolution::TwoK, [1, 2, 3, 4], [7, 14, 21, 28], [26, 52, 78, 104]),
      (GptImage2EditImageSize::SquareHd, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [10, 20, 30, 40], [41, 82, 123, 164]),
      (GptImage2EditImageSize::SquareHd, GptImage2Resolution::FourK, [2, 4, 6, 8], [10, 20, 30, 40], [41, 82, 123, 164]),
    ]
  }

  fn text_to_image_num_image_cases(expected_by_count: [u64; 4]) -> [(GptImage2TextToImageNumImages, u64); 4] {
    [(GptImage2TextToImageNumImages::One, expected_by_count[0]), (GptImage2TextToImageNumImages::Two, expected_by_count[1]), (GptImage2TextToImageNumImages::Three, expected_by_count[2]), (GptImage2TextToImageNumImages::Four, expected_by_count[3])]
  }

  fn edit_image_num_image_cases(expected_by_count: [u64; 4]) -> [(GptImage2EditImageNumImages, u64); 4] {
    [(GptImage2EditImageNumImages::One, expected_by_count[0]), (GptImage2EditImageNumImages::Two, expected_by_count[1]), (GptImage2EditImageNumImages::Three, expected_by_count[2]), (GptImage2EditImageNumImages::Four, expected_by_count[3])]
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
