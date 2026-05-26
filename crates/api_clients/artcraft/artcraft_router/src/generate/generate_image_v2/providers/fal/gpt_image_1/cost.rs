use fal_client::requests::api::image::edit::gpt_image_1_edit_image::api::{
  GptImage1EditImageNumImages, GptImage1EditImageQuality, GptImage1EditImageSize,
};
use fal_client::requests::api::image::text::gpt_image_1_text_to_image::api::{
  GptImage1TextToImageNumImages, GptImage1TextToImageQuality, GptImage1TextToImageSize,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1::request::FalGptImage1RequestState;

/// Cost state for Fal GPT Image 1. Mirrors v1
/// (`estimate_image_cost_fal_gpt_image_1`):
///
///   Output image cost (per output image):
///     Low:    2¢ all sizes
///     Medium: 5¢ square, 7¢ wide/tall
///     High:   17¢ square, 25¢ wide/tall
///
///   Plus 2¢ per input image in edit mode (high-fidelity estimate).
///   Quality defaults to High when unspecified.
///
/// The hand-rolled rates here intentionally override fal_client's trait
/// (which uses Medium as the default and omits the input-image fee). Keep
/// in sync with the v1 cost file.
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
      FalGptImage1RequestState::TextToImage(req) => {
        cost_t2i(req.quality, req.image_size, req.num_images)
      }
      FalGptImage1RequestState::EditImage(req) => {
        let output_cost = cost_edit_output(req.quality, req.image_size, req.num_images);
        let input_cost = 2 * req.image_urls.len() as u64;
        output_cost + input_cost
      }
    };

    ImageGenerationCostEstimate {
      // v1 sets cost_in_credits to the same value as USD cents (1:1).
      cost_in_credits: Some(cost_in_usd_cents),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

fn cost_t2i(
  quality: Option<GptImage1TextToImageQuality>,
  image_size: Option<GptImage1TextToImageSize>,
  num_images: GptImage1TextToImageNumImages,
) -> u64 {
  use GptImage1TextToImageQuality as Q;
  use GptImage1TextToImageSize as S;
  let q = quality.unwrap_or(Q::High);
  let is_square = matches!(image_size, None | Some(S::Square));
  let per_image = output_cost(matches!(q, Q::Low), matches!(q, Q::Medium), is_square);
  per_image * t2i_num_images(num_images)
}

fn cost_edit_output(
  quality: Option<GptImage1EditImageQuality>,
  image_size: Option<GptImage1EditImageSize>,
  num_images: GptImage1EditImageNumImages,
) -> u64 {
  use GptImage1EditImageQuality as Q;
  use GptImage1EditImageSize as S;
  let q = quality.unwrap_or(Q::High);
  let is_square = matches!(image_size, None | Some(S::Square));
  let per_image = output_cost(matches!(q, Q::Low), matches!(q, Q::Medium), is_square);
  per_image * edit_num_images(num_images)
}

fn output_cost(is_low: bool, is_medium: bool, is_square: bool) -> u64 {
  if is_low {
    2
  } else if is_medium {
    if is_square { 5 } else { 7 }
  } else {
    // High (default)
    if is_square { 17 } else { 25 }
  }
}

fn t2i_num_images(n: GptImage1TextToImageNumImages) -> u64 {
  match n {
    GptImage1TextToImageNumImages::One => 1,
    GptImage1TextToImageNumImages::Two => 2,
    GptImage1TextToImageNumImages::Three => 3,
    GptImage1TextToImageNumImages::Four => 4,
  }
}

fn edit_num_images(n: GptImage1EditImageNumImages) -> u64 {
  match n {
    GptImage1EditImageNumImages::One => 1,
    GptImage1EditImageNumImages::Two => 2,
    GptImage1EditImageNumImages::Three => 3,
    GptImage1EditImageNumImages::Four => 4,
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

  // Tables encode v1's pricing semantics:
  //   - Quality defaults to High when unspecified.
  //   - is_square = matches!(image_size, None | Some(Square)). Auto, Horizontal,
  //     and Vertical are treated as non-square.
  //   - Low is 2¢ for every size; Medium and High differ by square vs non-square.
  // Edit-mode rows additionally include a +2¢ input-image fee (one input URL
  // in the make_edit helper below).
  fn text_to_image_price_cases() -> [(Option<GptImage1TextToImageQuality>, Option<GptImage1TextToImageSize>, [u64; 4]); 13] {
    [
      // Default quality (None → High) + default size (None → square).
      (None, None, [17, 34, 51, 68]),
      // Low: flat 2¢ regardless of size.
      (Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Auto), [2, 4, 6, 8]),
      (Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Square), [2, 4, 6, 8]),
      (Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Horizontal), [2, 4, 6, 8]),
      (Some(GptImage1TextToImageQuality::Low), Some(GptImage1TextToImageSize::Vertical), [2, 4, 6, 8]),
      // Medium: 5¢ square, 7¢ non-square.
      (Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Auto), [7, 14, 21, 28]),
      (Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Square), [5, 10, 15, 20]),
      (Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Horizontal), [7, 14, 21, 28]),
      (Some(GptImage1TextToImageQuality::Medium), Some(GptImage1TextToImageSize::Vertical), [7, 14, 21, 28]),
      // High: 17¢ square, 25¢ non-square.
      (Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Auto), [25, 50, 75, 100]),
      (Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Square), [17, 34, 51, 68]),
      (Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Horizontal), [25, 50, 75, 100]),
      (Some(GptImage1TextToImageQuality::High), Some(GptImage1TextToImageSize::Vertical), [25, 50, 75, 100]),
    ]
  }

  // Each edit-mode row is t2i row + 2¢ (single input image — see make_edit
  // below). Numbers are constant +2 because input fee scales with input count,
  // not output count.
  fn edit_image_price_cases() -> [(Option<GptImage1EditImageQuality>, Option<GptImage1EditImageSize>, [u64; 4]); 13] {
    [
      (None, None, [19, 36, 53, 70]),
      (Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Auto), [4, 6, 8, 10]),
      (Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Square), [4, 6, 8, 10]),
      (Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Horizontal), [4, 6, 8, 10]),
      (Some(GptImage1EditImageQuality::Low), Some(GptImage1EditImageSize::Vertical), [4, 6, 8, 10]),
      (Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Auto), [9, 16, 23, 30]),
      (Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Square), [7, 12, 17, 22]),
      (Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Horizontal), [9, 16, 23, 30]),
      (Some(GptImage1EditImageQuality::Medium), Some(GptImage1EditImageSize::Vertical), [9, 16, 23, 30]),
      (Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Auto), [27, 52, 77, 102]),
      (Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Square), [19, 36, 53, 70]),
      (Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Horizontal), [27, 52, 77, 102]),
      (Some(GptImage1EditImageQuality::High), Some(GptImage1EditImageSize::Vertical), [27, 52, 77, 102]),
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
    assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
  }
}
