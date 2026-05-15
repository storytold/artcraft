use crate::requests::api::image::common::gpt_image_2_resolution::{compute_custom_image_size, GptImage2AspectRatio, GptImage2Resolution};
use crate::requests::api::image::text::gpt_image_2_text_to_image::api::{GptImage2TextToImageNumImages, GptImage2TextToImageQuality, GptImage2TextToImageRequest, GptImage2TextToImageSize};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

const PRICING_TABLE: &[GptImage2PriceRow] = &[GptImage2PriceRow { width: 1024, height: 768, low: 11, medium: 43, high: 151 }, GptImage2PriceRow { width: 1024, height: 1024, low: 15, medium: 61, high: 219 }, GptImage2PriceRow { width: 1024, height: 1536, low: 18, medium: 54, high: 178 }, GptImage2PriceRow { width: 1920, height: 1080, low: 17, medium: 53, high: 158 }, GptImage2PriceRow { width: 2560, height: 1440, low: 19, medium: 68, high: 234 }, GptImage2PriceRow { width: 3840, height: 2160, low: 24, medium: 113, high: 413 }];

#[derive(Copy, Clone)]
struct GptImage2PriceRow {
  width: u32,
  height: u32,
  low: u64,
  medium: u64,
  high: u64,
}

impl GptImage2PriceRow {
  fn price_in_tenths_of_a_cent(self, quality: GptImage2TextToImageQuality) -> u64 {
    match quality {
      GptImage2TextToImageQuality::Low => self.low,
      GptImage2TextToImageQuality::Medium => self.medium,
      GptImage2TextToImageQuality::High => self.high,
    }
  }
}

impl FalRequestCostCalculator for GptImage2TextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let quality = self.quality.unwrap_or(GptImage2TextToImageQuality::High);
    let (width, height) = dimensions_for_request(self);
    let price = closest_price_row(width, height).price_in_tenths_of_a_cent(quality);
    let total_tenths_of_a_cent = price * num_images(self.num_images);

    total_tenths_of_a_cent.div_ceil(10) as UsdCents
  }
}

fn dimensions_for_request(request: &GptImage2TextToImageRequest) -> (u32, u32) {
  match (request.image_size, request.resolution) {
    (Some(size), Some(resolution)) => {
      let aspect = size_to_aspect(size);
      let custom = compute_custom_image_size(aspect, resolution);
      (custom.width, custom.height)
    },
    (None, Some(resolution)) => {
      let custom = compute_custom_image_size(GptImage2AspectRatio::Square, resolution);
      (custom.width, custom.height)
    },
    (Some(size), None) => preset_dimensions(size),
    (None, None) => preset_dimensions(GptImage2TextToImageSize::Square),
  }
}

fn preset_dimensions(size: GptImage2TextToImageSize) -> (u32, u32) {
  match size {
    GptImage2TextToImageSize::SquareHd => (2048, 2048),
    GptImage2TextToImageSize::Square => (1024, 1024),
    GptImage2TextToImageSize::Portrait4x3 => (768, 1024),
    GptImage2TextToImageSize::Portrait16x9 => (1080, 1920),
    GptImage2TextToImageSize::Landscape4x3 => (1024, 768),
    GptImage2TextToImageSize::Landscape16x9 => (1920, 1080),
  }
}

fn size_to_aspect(size: GptImage2TextToImageSize) -> GptImage2AspectRatio {
  match size {
    GptImage2TextToImageSize::Square => GptImage2AspectRatio::Square,
    GptImage2TextToImageSize::SquareHd => GptImage2AspectRatio::SquareHd,
    GptImage2TextToImageSize::Landscape4x3 => GptImage2AspectRatio::Landscape4x3,
    GptImage2TextToImageSize::Landscape16x9 => GptImage2AspectRatio::Landscape16x9,
    GptImage2TextToImageSize::Portrait4x3 => GptImage2AspectRatio::Portrait4x3,
    GptImage2TextToImageSize::Portrait16x9 => GptImage2AspectRatio::Portrait16x9,
  }
}

fn closest_price_row(width: u32, height: u32) -> GptImage2PriceRow {
  let pixels = width as u64 * height as u64;
  PRICING_TABLE
    .iter()
    .copied()
    .min_by_key(|row| {
      let row_pixels = row.width as u64 * row.height as u64;
      row_pixels.abs_diff(pixels)
    })
    .expect("GPT Image 2 pricing table cannot be empty")
}

fn num_images(num_images: GptImage2TextToImageNumImages) -> u64 {
  match num_images {
    GptImage2TextToImageNumImages::One => 1,
    GptImage2TextToImageNumImages::Two => 2,
    GptImage2TextToImageNumImages::Three => 3,
    GptImage2TextToImageNumImages::Four => 4,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const QUALITIES: &[(GptImage2TextToImageQuality, u64, u64, u64, u64, u64, u64)] = &[
    (GptImage2TextToImageQuality::Low, 11, 15, 18, 17, 19, 24),
    (GptImage2TextToImageQuality::Medium, 43, 61, 54, 53, 68, 113),
    (GptImage2TextToImageQuality::High, 151, 219, 178, 158, 234, 413)
  ];

  const PRESET_CASES: &[(GptImage2TextToImageSize, u64)] = &[
    (GptImage2TextToImageSize::Landscape4x3, 0),
    (GptImage2TextToImageSize::Portrait4x3, 0),
    (GptImage2TextToImageSize::Square, 1),
    (GptImage2TextToImageSize::Landscape16x9, 3),
    (GptImage2TextToImageSize::Portrait16x9, 3),
    (GptImage2TextToImageSize::SquareHd, 4),
  ];

  const RESOLUTION_CASES: &[(GptImage2TextToImageSize, GptImage2Resolution, u64)] = &[
    (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::OneK, 0),
    (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::TwoK, 4),
    (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::ThreeK, 5),
    (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::FourK, 5),
    (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::OneK, 0),
    (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::TwoK, 3),
    (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::ThreeK, 4),
    (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::FourK, 5),
    (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::OneK, 0),
    (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::TwoK, 4),
    (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::ThreeK, 5),
    (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::FourK, 5),
    (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::OneK, 0),
    (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::TwoK, 3),
    (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::ThreeK, 4),
    (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::FourK, 5),
    (GptImage2TextToImageSize::Square, GptImage2Resolution::OneK, 1),
    (GptImage2TextToImageSize::Square, GptImage2Resolution::TwoK, 4),
    (GptImage2TextToImageSize::Square, GptImage2Resolution::ThreeK, 5),
    (GptImage2TextToImageSize::Square, GptImage2Resolution::FourK, 5),
    (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::OneK, 1),
    (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::TwoK, 4),
    (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::ThreeK, 5),
    (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::FourK, 5),
  ];

  const SPOT_PRICE_CASES: &[(GptImage2TextToImageSize, GptImage2Resolution, GptImage2TextToImageNumImages, u64)] = &[
    (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::OneK, GptImage2TextToImageNumImages::One, 16),
    (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::TwoK, GptImage2TextToImageNumImages::Two, 47),
    (GptImage2TextToImageSize::Landscape4x3, GptImage2Resolution::ThreeK, GptImage2TextToImageNumImages::Three, 124),
    (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::TwoK, GptImage2TextToImageNumImages::Four, 64),
    (GptImage2TextToImageSize::Landscape16x9, GptImage2Resolution::FourK, GptImage2TextToImageNumImages::Two, 83),
    (GptImage2TextToImageSize::Portrait4x3, GptImage2Resolution::TwoK, GptImage2TextToImageNumImages::One, 24),
    (GptImage2TextToImageSize::Portrait16x9, GptImage2Resolution::ThreeK, GptImage2TextToImageNumImages::Three, 71),
    (GptImage2TextToImageSize::Square, GptImage2Resolution::OneK, GptImage2TextToImageNumImages::Four, 88),
    (GptImage2TextToImageSize::Square, GptImage2Resolution::FourK, GptImage2TextToImageNumImages::Four, 166),
    (GptImage2TextToImageSize::SquareHd, GptImage2Resolution::TwoK, GptImage2TextToImageNumImages::Three, 71),
  ];

  fn make_request(num_images: GptImage2TextToImageNumImages, quality: Option<GptImage2TextToImageQuality>, image_size: Option<GptImage2TextToImageSize>, resolution: Option<GptImage2Resolution>) -> GptImage2TextToImageRequest {
    GptImage2TextToImageRequest { prompt: "test".to_string(), num_images, image_size, quality, resolution, output_format: None }
  }

  #[test]
  fn cost_defaults_to_high_square() {
    assert_eq!(make_request(GptImage2TextToImageNumImages::One, None, None, None).calculate_cost_in_cents(), 22);
  }

  #[test]
  fn cost_rounds_final_request_total_up_to_whole_cents() {
    assert_eq!(make_request(GptImage2TextToImageNumImages::Four, Some(GptImage2TextToImageQuality::Low), Some(GptImage2TextToImageSize::Landscape4x3), None,).calculate_cost_in_cents(), 5,);
  }

  #[test]
  fn preset_pricing_matches_published_table() {
    for &(quality, landscape_4x3, square, portrait, landscape_16x9, square_hd, four_k) in QUALITIES {
      let expected_by_row = [landscape_4x3, square, portrait, landscape_16x9, square_hd, four_k];

      for &(size, row_index) in PRESET_CASES {
        let expected = expected_by_row[row_index as usize].div_ceil(10);
        assert_eq!(make_request(GptImage2TextToImageNumImages::One, Some(quality), Some(size), None).calculate_cost_in_cents(), expected, "quality={quality:?} size={size:?}",);
      }
    }
  }

  #[test]
  fn exact_published_rows_match_all_quality_prices() {
    for &(quality, landscape_4x3, square, portrait, landscape_16x9, square_hd, four_k) in QUALITIES {
      let cases = [(1024, 768, landscape_4x3), (1024, 1024, square), (1024, 1536, portrait), (1920, 1080, landscape_16x9), (2560, 1440, square_hd), (3840, 2160, four_k)];

      for (width, height, expected) in cases {
        assert_eq!(closest_price_row(width, height).price_in_tenths_of_a_cent(quality), expected, "quality={quality:?} dimensions={width}x{height}",);
      }
    }
  }

  #[test]
  fn resolution_pricing_covers_aspect_size_resolution_combinations() {
    for &(quality, landscape_4x3, square, portrait, landscape_16x9, square_hd, four_k) in QUALITIES {
      let expected_by_row = [landscape_4x3, square, portrait, landscape_16x9, square_hd, four_k];

      for &(size, resolution, row_index) in RESOLUTION_CASES {
        let expected = expected_by_row[row_index as usize].div_ceil(10);
        assert_eq!(make_request(GptImage2TextToImageNumImages::One, Some(quality), Some(size), Some(resolution)).calculate_cost_in_cents(), expected, "quality={quality:?} size={size:?} resolution={resolution:?}",);
      }
    }
  }

  #[test]
  fn high_quality_spot_prices_match_expected_cents() {
    for &(size, resolution, num_images, expected) in SPOT_PRICE_CASES {
      assert_eq!(make_request(num_images, Some(GptImage2TextToImageQuality::High), Some(size), Some(resolution)).calculate_cost_in_cents(), expected, "size={size:?} resolution={resolution:?} num_images={num_images:?}",);
    }
  }

  #[test]
  fn resolution_without_image_size_defaults_to_square_aspect() {
    assert_eq!(make_request(GptImage2TextToImageNumImages::Two, Some(GptImage2TextToImageQuality::High), None, Some(GptImage2Resolution::FourK),).calculate_cost_in_cents(), 83,);
  }
}
