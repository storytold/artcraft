use fal_client::requests::api::image::edit::gpt_image_2_edit_image::api::{
  GptImage2EditImageNumImages, GptImage2EditImageQuality, GptImage2EditImageSize,
};
use fal_client::requests::api::image::text::gpt_image_2_text_to_image::api::{
  GptImage2TextToImageNumImages, GptImage2TextToImageQuality, GptImage2TextToImageSize,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::gpt_image_2::request::FalGptImage2RequestState;

/// Cost state for Fal GPT Image 2. Mirrors v1
/// (`estimate_image_cost_fal_gpt_image_2`):
///
///   Output image cost (per output image), rounded up to whole cents:
///     Low:    1¢ all sizes
///     Medium: 6¢ square/squareHD/auto; 4¢ landscape/portrait (4:3 or 16:9)
///     High:  22¢ square; 23¢ squareHD/auto;
///            15¢ landscape/portrait 4:3; 16¢ landscape/portrait 16:9
///
///   Quality defaults to High when unspecified. Resolution is NOT priced
///   separately — v1's table only varies by quality + size.
///
/// The hand-rolled rates here intentionally override fal_client's trait,
/// which uses a base+per-megapixel formula that scales with the resolution
/// field. Keep in sync with v1.
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
      FalGptImage2RequestState::TextToImage(req) => {
        cost_t2i(req.quality, req.image_size, req.num_images)
      }
      FalGptImage2RequestState::EditImage(req) => {
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
enum SizeBucket {
  Square,
  SquareHd,
  Landscape4x3,
  Landscape16x9,
  Portrait4x3,
  Portrait16x9,
  Auto,
}

fn cost_t2i(
  quality: Option<GptImage2TextToImageQuality>,
  image_size: Option<GptImage2TextToImageSize>,
  num_images: GptImage2TextToImageNumImages,
) -> u64 {
  use GptImage2TextToImageQuality as Q;
  use GptImage2TextToImageSize as S;
  let q = quality.unwrap_or(Q::High);
  // T2I size enum has no Auto variant — `None` is the only auto-equivalent.
  let bucket = match image_size {
    None => SizeBucket::Auto,
    Some(S::Square) => SizeBucket::Square,
    Some(S::SquareHd) => SizeBucket::SquareHd,
    Some(S::Landscape4x3) => SizeBucket::Landscape4x3,
    Some(S::Landscape16x9) => SizeBucket::Landscape16x9,
    Some(S::Portrait4x3) => SizeBucket::Portrait4x3,
    Some(S::Portrait16x9) => SizeBucket::Portrait16x9,
  };
  output_cost(matches!(q, Q::Low), matches!(q, Q::Medium), bucket) * t2i_num_images(num_images)
}

fn cost_edit(
  quality: Option<GptImage2EditImageQuality>,
  image_size: Option<GptImage2EditImageSize>,
  num_images: GptImage2EditImageNumImages,
) -> u64 {
  use GptImage2EditImageQuality as Q;
  use GptImage2EditImageSize as S;
  let q = quality.unwrap_or(Q::High);
  let bucket = match image_size {
    None | Some(S::Auto) => SizeBucket::Auto,
    Some(S::Square) => SizeBucket::Square,
    Some(S::SquareHd) => SizeBucket::SquareHd,
    Some(S::Landscape4x3) => SizeBucket::Landscape4x3,
    Some(S::Landscape16x9) => SizeBucket::Landscape16x9,
    Some(S::Portrait4x3) => SizeBucket::Portrait4x3,
    Some(S::Portrait16x9) => SizeBucket::Portrait16x9,
  };
  output_cost(matches!(q, Q::Low), matches!(q, Q::Medium), bucket) * edit_num_images(num_images)
}

fn output_cost(is_low: bool, is_medium: bool, bucket: SizeBucket) -> u64 {
  if is_low {
    return 1;
  }
  if is_medium {
    return match bucket {
      SizeBucket::Square | SizeBucket::SquareHd | SizeBucket::Auto => 6,
      SizeBucket::Landscape4x3 | SizeBucket::Portrait4x3
      | SizeBucket::Landscape16x9 | SizeBucket::Portrait16x9 => 4,
    };
  }
  // High (default)
  match bucket {
    SizeBucket::Square => 22,
    SizeBucket::SquareHd | SizeBucket::Auto => 23,
    SizeBucket::Landscape4x3 | SizeBucket::Portrait4x3 => 15,
    SizeBucket::Landscape16x9 | SizeBucket::Portrait16x9 => 16,
  }
}

fn t2i_num_images(n: GptImage2TextToImageNumImages) -> u64 {
  match n {
    GptImage2TextToImageNumImages::One => 1,
    GptImage2TextToImageNumImages::Two => 2,
    GptImage2TextToImageNumImages::Three => 3,
    GptImage2TextToImageNumImages::Four => 4,
  }
}

fn edit_num_images(n: GptImage2EditImageNumImages) -> u64 {
  match n {
    GptImage2EditImageNumImages::One => 1,
    GptImage2EditImageNumImages::Two => 2,
    GptImage2EditImageNumImages::Three => 3,
    GptImage2EditImageNumImages::Four => 4,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
  use fal_client::requests::api::image::edit::gpt_image_2_edit_image::api::{GptImage2EditImageNumImages, GptImage2EditImageQuality, GptImage2EditImageRequest, GptImage2EditImageSize};
  use fal_client::requests::api::image::text::gpt_image_2_text_to_image::api::{GptImage2TextToImageNumImages, GptImage2TextToImageQuality, GptImage2TextToImageRequest, GptImage2TextToImageSize};

  type TextPriceCase = (Option<GptImage2TextToImageQuality>, Option<GptImage2TextToImageSize>, [u64; 4]);
  type EditPriceCase = (Option<GptImage2EditImageQuality>, Option<GptImage2EditImageSize>, [u64; 4]);

  // v1 doesn't price by resolution — only quality + size. The Fal request's
  // resolution field is sent to Fal for actual generation but doesn't enter
  // the cost calculation.

  #[test]
  fn text_to_image_cost_table_covers_quality_and_size() {
    for (quality, image_size, expected_by_count) in text_to_image_price_cases() {
      for (num_images, expected) in text_to_image_num_image_cases(expected_by_count) {
        let request = FalGptImage2RequestState::TextToImage(GptImage2TextToImageRequest { prompt: "test".to_string(), num_images, image_size, resolution: None, quality, output_format: None });
        let cost = FalGptImage2CostState::from_request(&request).estimate_cost();
        assert_standard_cost_estimate(cost, expected);
      }
    }
  }

  #[test]
  fn edit_image_cost_table_covers_quality_and_size() {
    for (quality, image_size, expected_by_count) in edit_image_price_cases() {
      for (num_images, expected) in edit_image_num_image_cases(expected_by_count) {
        let request = FalGptImage2RequestState::EditImage(GptImage2EditImageRequest { prompt: "test".to_string(), image_urls: vec!["https://example.com/image.png".to_string()], num_images, mask_url: None, image_size, resolution: None, quality, output_format: None });
        let cost = FalGptImage2CostState::from_request(&request).estimate_cost();
        assert_standard_cost_estimate(cost, expected);
      }
    }
  }

  // v1 rates (independent of resolution):
  //   Low: 1¢ all sizes
  //   Medium: 6¢ Square/SquareHd/Auto; 4¢ Landscape/Portrait (4:3 or 16:9)
  //   High: 22¢ Square; 23¢ SquareHd/Auto; 15¢ 4:3 (L/P); 16¢ 16:9 (L/P)
  // Default quality is High.
  fn text_to_image_price_cases() -> Vec<TextPriceCase> {
    vec![
      (None, None, [23, 46, 69, 92]),
      // Low
      // No Auto variant on t2i — None is the only auto-equivalent (tested above).
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Square), [1, 2, 3, 4]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::SquareHd), [1, 2, 3, 4]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Landscape4x3), [1, 2, 3, 4]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Landscape16x9), [1, 2, 3, 4]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Portrait4x3), [1, 2, 3, 4]),
      (Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Portrait16x9), [1, 2, 3, 4]),
      // Medium
      // No Auto variant on t2i.
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Square), [6, 12, 18, 24]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::SquareHd), [6, 12, 18, 24]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Landscape4x3), [4, 8, 12, 16]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Landscape16x9), [4, 8, 12, 16]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Portrait4x3), [4, 8, 12, 16]),
      (Some(GptImage2TextToImageQuality::Medium), Some(GptImage2TextToImageSize::Portrait16x9), [4, 8, 12, 16]),
      // High
      // No Auto variant on t2i.
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Square), [22, 44, 66, 88]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::SquareHd), [23, 46, 69, 92]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Landscape4x3), [15, 30, 45, 60]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Landscape16x9), [16, 32, 48, 64]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Portrait4x3), [15, 30, 45, 60]),
      (Some(GptImage2TextToImageQuality::High), Some(GptImage2TextToImageSize::Portrait16x9), [16, 32, 48, 64]),
    ]
  }

  // Edit-mode pricing is identical to t2i (v1 has no input-image fee for
  // gpt_image_2 — only gpt_image_1 has that fee).
  fn edit_image_price_cases() -> Vec<EditPriceCase> {
    vec![
      (None, None, [23, 46, 69, 92]),
      // Low
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Auto), [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Square), [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::SquareHd), [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Landscape4x3), [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Landscape16x9), [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Portrait4x3), [1, 2, 3, 4]),
      (Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Portrait16x9), [1, 2, 3, 4]),
      // Medium
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Auto), [6, 12, 18, 24]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Square), [6, 12, 18, 24]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::SquareHd), [6, 12, 18, 24]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Landscape4x3), [4, 8, 12, 16]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Landscape16x9), [4, 8, 12, 16]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Portrait4x3), [4, 8, 12, 16]),
      (Some(GptImage2EditImageQuality::Medium), Some(GptImage2EditImageSize::Portrait16x9), [4, 8, 12, 16]),
      // High
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Auto), [23, 46, 69, 92]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Square), [22, 44, 66, 88]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::SquareHd), [23, 46, 69, 92]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Landscape4x3), [15, 30, 45, 60]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Landscape16x9), [16, 32, 48, 64]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Portrait4x3), [15, 30, 45, 60]),
      (Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Portrait16x9), [16, 32, 48, 64]),
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
    assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
  }
}
