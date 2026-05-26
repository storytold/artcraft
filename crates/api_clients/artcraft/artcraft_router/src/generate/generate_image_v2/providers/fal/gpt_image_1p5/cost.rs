use fal_client::requests::api::image::edit::gpt_image_1p5_edit_image::api::{
  GptImage1p5EditImageNumImages, GptImage1p5EditImageQuality, GptImage1p5EditImageSize,
};
use fal_client::requests::api::image::text::gpt_image_1p5_text_to_image::api::{
  GptImage1p5TextToImageNumImages, GptImage1p5TextToImageQuality, GptImage1p5TextToImageSize,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1p5::request::FalGptImage1p5RequestState;

/// Cost state for Fal GPT Image 1.5. Mirrors v1
/// (`estimate_image_cost_fal_gpt_image_1p5`):
///
///   Output image cost (per output image), rounded up to whole cents:
///     Low:    1¢ square, 2¢ wide/tall
///     Medium: 4¢ square, 5¢ wide, 6¢ tall
///     High:  14¢ square, 20¢ wide/tall
///
///   Quality defaults to High when unspecified.
///
/// The hand-rolled rates here intentionally override fal_client's trait,
/// which rounds $0.133→13¢ for High+Square (v1 rounds up to 14¢) and
/// flattens Medium wide/tall to a single value. Keep in sync with v1.
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
      FalGptImage1p5RequestState::TextToImage(req) => {
        cost_t2i(req.quality, req.image_size, req.num_images)
      }
      FalGptImage1p5RequestState::EditImage(req) => {
        cost_edit(req.quality, req.image_size, req.num_images)
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

#[derive(Copy, Clone)]
enum SizeBucket { Square, Wide, Tall }

fn cost_t2i(
  quality: Option<GptImage1p5TextToImageQuality>,
  image_size: Option<GptImage1p5TextToImageSize>,
  num_images: GptImage1p5TextToImageNumImages,
) -> u64 {
  use GptImage1p5TextToImageQuality as Q;
  use GptImage1p5TextToImageSize as S;
  let q = quality.unwrap_or(Q::High);
  let bucket = match image_size {
    None | Some(S::Square) => SizeBucket::Square,
    Some(S::Wide) => SizeBucket::Wide,
    Some(S::Tall) => SizeBucket::Tall,
  };
  let per_image = output_cost(matches!(q, Q::Low), matches!(q, Q::Medium), bucket);
  per_image * t2i_num_images(num_images)
}

fn cost_edit(
  quality: Option<GptImage1p5EditImageQuality>,
  image_size: Option<GptImage1p5EditImageSize>,
  num_images: GptImage1p5EditImageNumImages,
) -> u64 {
  use GptImage1p5EditImageQuality as Q;
  use GptImage1p5EditImageSize as S;
  let q = quality.unwrap_or(Q::High);
  let bucket = match image_size {
    None | Some(S::Square) => SizeBucket::Square,
    Some(S::Wide) => SizeBucket::Wide,
    Some(S::Tall) => SizeBucket::Tall,
  };
  let per_image = output_cost(matches!(q, Q::Low), matches!(q, Q::Medium), bucket);
  per_image * edit_num_images(num_images)
}

fn output_cost(is_low: bool, is_medium: bool, bucket: SizeBucket) -> u64 {
  if is_low {
    match bucket { SizeBucket::Square => 1, _ => 2 }
  } else if is_medium {
    match bucket {
      SizeBucket::Square => 4,
      SizeBucket::Wide => 5,
      SizeBucket::Tall => 6,
    }
  } else {
    // High (default)
    match bucket { SizeBucket::Square => 14, _ => 20 }
  }
}

fn t2i_num_images(n: GptImage1p5TextToImageNumImages) -> u64 {
  match n {
    GptImage1p5TextToImageNumImages::One => 1,
    GptImage1p5TextToImageNumImages::Two => 2,
    GptImage1p5TextToImageNumImages::Three => 3,
    GptImage1p5TextToImageNumImages::Four => 4,
  }
}

fn edit_num_images(n: GptImage1p5EditImageNumImages) -> u64 {
  match n {
    GptImage1p5EditImageNumImages::One => 1,
    GptImage1p5EditImageNumImages::Two => 2,
    GptImage1p5EditImageNumImages::Three => 3,
    GptImage1p5EditImageNumImages::Four => 4,
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

  // v1 rates: Low=1/2 (sq/wide-tall), Medium=4/5/6 (sq/wide/tall),
  // High=14/20/20 (sq/wide/tall). Default quality is High.
  fn text_to_image_price_cases() -> [(Option<GptImage1p5TextToImageQuality>, Option<GptImage1p5TextToImageSize>, [u64; 4]); 10] {
    [
      (None, None, [14, 28, 42, 56]),
      (Some(GptImage1p5TextToImageQuality::Low), Some(GptImage1p5TextToImageSize::Square), [1, 2, 3, 4]),
      (Some(GptImage1p5TextToImageQuality::Low), Some(GptImage1p5TextToImageSize::Wide), [2, 4, 6, 8]),
      (Some(GptImage1p5TextToImageQuality::Low), Some(GptImage1p5TextToImageSize::Tall), [2, 4, 6, 8]),
      (Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Square), [4, 8, 12, 16]),
      (Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Wide), [5, 10, 15, 20]),
      (Some(GptImage1p5TextToImageQuality::Medium), Some(GptImage1p5TextToImageSize::Tall), [6, 12, 18, 24]),
      (Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Square), [14, 28, 42, 56]),
      (Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Wide), [20, 40, 60, 80]),
      (Some(GptImage1p5TextToImageQuality::High), Some(GptImage1p5TextToImageSize::Tall), [20, 40, 60, 80]),
    ]
  }

  // Edit-mode pricing is identical to t2i (v1 has no input-image fee for
  // gpt_image_1p5 — that's only gpt_image_1).
  fn edit_image_price_cases() -> [(Option<GptImage1p5EditImageQuality>, Option<GptImage1p5EditImageSize>, [u64; 4]); 10] {
    [
      (None, None, [14, 28, 42, 56]),
      (Some(GptImage1p5EditImageQuality::Low), Some(GptImage1p5EditImageSize::Square), [1, 2, 3, 4]),
      (Some(GptImage1p5EditImageQuality::Low), Some(GptImage1p5EditImageSize::Wide), [2, 4, 6, 8]),
      (Some(GptImage1p5EditImageQuality::Low), Some(GptImage1p5EditImageSize::Tall), [2, 4, 6, 8]),
      (Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Square), [4, 8, 12, 16]),
      (Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Wide), [5, 10, 15, 20]),
      (Some(GptImage1p5EditImageQuality::Medium), Some(GptImage1p5EditImageSize::Tall), [6, 12, 18, 24]),
      (Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Square), [14, 28, 42, 56]),
      (Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Wide), [20, 40, 60, 80]),
      (Some(GptImage1p5EditImageQuality::High), Some(GptImage1p5EditImageSize::Tall), [20, 40, 60, 80]),
    ]
  }

  fn text_to_image_num_image_cases(expected_by_count: [u64; 4]) -> [(GptImage1p5TextToImageNumImages, u64); 4] {
    [(GptImage1p5TextToImageNumImages::One, expected_by_count[0]), (GptImage1p5TextToImageNumImages::Two, expected_by_count[1]), (GptImage1p5TextToImageNumImages::Three, expected_by_count[2]), (GptImage1p5TextToImageNumImages::Four, expected_by_count[3])]
  }

  fn edit_image_num_image_cases(expected_by_count: [u64; 4]) -> [(GptImage1p5EditImageNumImages, u64); 4] {
    [(GptImage1p5EditImageNumImages::One, expected_by_count[0]), (GptImage1p5EditImageNumImages::Two, expected_by_count[1]), (GptImage1p5EditImageNumImages::Three, expected_by_count[2]), (GptImage1p5EditImageNumImages::Four, expected_by_count[3])]
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
