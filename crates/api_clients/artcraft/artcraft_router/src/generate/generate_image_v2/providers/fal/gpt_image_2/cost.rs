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
      (None, None, None, [22, 44, 66, 88]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Landscape4x3), None, [2, 3, 4, 5]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Portrait4x3), None, [2, 3, 4, 5]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Square), None, [2, 3, 5, 6]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Landscape16x9), None, [2, 4, 6, 7]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Portrait16x9), None, [2, 4, 6, 7]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::SquareHd), None, [2, 4, 6, 8]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Landscape4x3), None, [5, 9, 13, 18]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Portrait4x3), None, [5, 9, 13, 18]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Square), None, [7, 13, 19, 25]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Landscape16x9), None, [6, 11, 16, 22]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Portrait16x9), None, [6, 11, 16, 22]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::SquareHd), None, [7, 14, 21, 28]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Landscape4x3), None, [16, 31, 46, 61]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Portrait4x3), None, [16, 31, 46, 61]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Square), None, [22, 44, 66, 88]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Landscape16x9), None, [16, 32, 48, 64]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Portrait16x9), None, [16, 32, 48, 64]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::SquareHd), None, [24, 47, 71, 94]),
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
      (None, None, None, [22, 44, 66, 88]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Auto), None, [3, 5, 8, 10]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Auto), None, [12, 23, 34, 46]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Auto), None, [42, 83, 124, 166]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Auto), Some(GptImage2Resolution::OneK), [3, 5, 8, 10]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Auto), Some(GptImage2Resolution::OneK), [12, 23, 34, 46]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Auto), Some(GptImage2Resolution::OneK), [42, 83, 124, 166]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Landscape4x3), None, [2, 3, 4, 5]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Portrait4x3), None, [2, 3, 4, 5]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Square), None, [2, 3, 5, 6]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Landscape16x9), None, [2, 4, 6, 7]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Portrait16x9), None, [2, 4, 6, 7]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::SquareHd), None, [2, 4, 6, 8]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Landscape4x3), None, [5, 9, 13, 18]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Portrait4x3), None, [5, 9, 13, 18]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Square), None, [7, 13, 19, 25]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Landscape16x9), None, [6, 11, 16, 22]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Portrait16x9), None, [6, 11, 16, 22]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::SquareHd), None, [7, 14, 21, 28]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Landscape4x3), None, [16, 31, 46, 61]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Portrait4x3), None, [16, 31, 46, 61]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Square), None, [22, 44, 66, 88]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Landscape16x9), None, [16, 32, 48, 64]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Portrait16x9), None, [16, 32, 48, 64]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::SquareHd), None, [24, 47, 71, 94]),
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
      (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::OneK, [2, 3, 4, 5], [5, 9, 13, 18], [16, 31, 46, 61]),
      (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::TwoK, [2, 4, 6, 8], [7, 14, 21, 28], [24, 47, 71, 94]),
      (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::ThreeK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
      (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::FourK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
      (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::OneK, [2, 3, 4, 5], [5, 9, 13, 18], [16, 31, 46, 61]),
      (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::TwoK, [2, 4, 6, 7], [6, 11, 16, 22], [16, 32, 48, 64]),
      (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [7, 14, 21, 28], [24, 47, 71, 94]),
      (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::FourK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
      (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::OneK, [2, 3, 4, 5], [5, 9, 13, 18], [16, 31, 46, 61]),
      (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::TwoK, [2, 4, 6, 8], [7, 14, 21, 28], [24, 47, 71, 94]),
      (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::ThreeK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
      (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::FourK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
      (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::OneK, [2, 3, 4, 5], [5, 9, 13, 18], [16, 31, 46, 61]),
      (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::TwoK, [2, 4, 6, 7], [6, 11, 16, 22], [16, 32, 48, 64]),
      (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::ThreeK, [2, 4, 6, 8], [7, 14, 21, 28], [24, 47, 71, 94]),
      (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::FourK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
      (GptImage2TextToImageSize::Square, GptImage2Resolution::OneK, [2, 3, 5, 6], [7, 13, 19, 25], [22, 44, 66, 88]),
      (GptImage2TextToImageSize::Square, GptImage2Resolution::TwoK, [2, 4, 6, 8], [7, 14, 21, 28], [24, 47, 71, 94]),
      (GptImage2TextToImageSize::Square, GptImage2Resolution::ThreeK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
      (GptImage2TextToImageSize::Square, GptImage2Resolution::FourK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
      (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::OneK, [2, 3, 5, 6], [7, 13, 19, 25], [22, 44, 66, 88]),
      (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::TwoK, [2, 4, 6, 8], [7, 14, 21, 28], [24, 47, 71, 94]),
      (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::ThreeK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
      (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::FourK, [3, 5, 8, 10], [12, 23, 34, 46], [42, 83, 124, 166]),
    ]
  }

  fn edit_image_resolution_price_cases() -> Vec<(GptImage2EditImageSize, GptImage2Resolution, [u64; 4], [u64; 4], [u64; 4])> {
    text_to_image_resolution_price_cases()
      .into_iter()
      .map(|(size, resolution, low, medium, high)| {
        let edit_size = match size {
          GptImage2TextToImageSize::SquareHd => GptImage2EditImageSize::SquareHd,
          GptImage2TextToImageSize::Square => GptImage2EditImageSize::Square,
          GptImage2TextToImageSize::Portrait4x3 => GptImage2EditImageSize::Portrait4x3,
          GptImage2TextToImageSize::Portrait16x9 => GptImage2EditImageSize::Portrait16x9,
          GptImage2TextToImageSize::Landscape4x3 => GptImage2EditImageSize::Landscape4x3,
          GptImage2TextToImageSize::Landscape16x9 => GptImage2EditImageSize::Landscape16x9,
        };
        (edit_size, resolution, low, medium, high)
      })
      .collect()
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
