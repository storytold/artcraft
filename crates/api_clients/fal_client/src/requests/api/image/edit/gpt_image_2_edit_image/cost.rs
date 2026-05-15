use crate::requests::api::image::common::gpt_image_2_resolution::{compute_custom_image_size, GptImage2AspectRatio, GptImage2Resolution};
use crate::requests::api::image::edit::gpt_image_2_edit_image::api::{GptImage2EditImageNumImages, GptImage2EditImageQuality, GptImage2EditImageRequest, GptImage2EditImageSize};
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
  fn price_in_tenths_of_a_cent(self, quality: GptImage2EditImageQuality) -> u64 {
    match quality {
      GptImage2EditImageQuality::Low => self.low,
      GptImage2EditImageQuality::Medium => self.medium,
      GptImage2EditImageQuality::High => self.high,
    }
  }
}

impl FalRequestCostCalculator for GptImage2EditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let quality = self.quality.unwrap_or(GptImage2EditImageQuality::High);
    let price = match dimensions_for_request(self) {
      Some((width, height)) => closest_price_row(width, height).price_in_tenths_of_a_cent(quality),
      None => max_price_for_quality(quality),
    };
    let total_tenths_of_a_cent = price * num_images(self.num_images);

    total_tenths_of_a_cent.div_ceil(10) as UsdCents
  }
}

fn dimensions_for_request(request: &GptImage2EditImageRequest) -> Option<(u32, u32)> {
  match (request.image_size, request.resolution) {
    (Some(GptImage2EditImageSize::Auto), _) => None,
    (Some(size), Some(resolution)) => {
      let aspect = size_to_aspect(size);
      let custom = compute_custom_image_size(aspect, resolution);
      Some((custom.width, custom.height))
    },
    (None, Some(resolution)) => {
      let custom = compute_custom_image_size(GptImage2AspectRatio::Square, resolution);
      Some((custom.width, custom.height))
    },
    (Some(size), None) => Some(preset_dimensions(size)),
    (None, None) => Some(preset_dimensions(GptImage2EditImageSize::Square)),
  }
}

fn preset_dimensions(size: GptImage2EditImageSize) -> (u32, u32) {
  match size {
    GptImage2EditImageSize::SquareHd => (2048, 2048),
    GptImage2EditImageSize::Square => (1024, 1024),
    GptImage2EditImageSize::Portrait4x3 => (768, 1024),
    GptImage2EditImageSize::Portrait16x9 => (1080, 1920),
    GptImage2EditImageSize::Landscape4x3 => (1024, 768),
    GptImage2EditImageSize::Landscape16x9 => (1920, 1080),
    GptImage2EditImageSize::Auto => (3840, 2160),
  }
}

fn size_to_aspect(size: GptImage2EditImageSize) -> GptImage2AspectRatio {
  match size {
    GptImage2EditImageSize::Square => GptImage2AspectRatio::Square,
    GptImage2EditImageSize::SquareHd => GptImage2AspectRatio::SquareHd,
    GptImage2EditImageSize::Landscape4x3 => GptImage2AspectRatio::Landscape4x3,
    GptImage2EditImageSize::Landscape16x9 => GptImage2AspectRatio::Landscape16x9,
    GptImage2EditImageSize::Portrait4x3 => GptImage2AspectRatio::Portrait4x3,
    GptImage2EditImageSize::Portrait16x9 => GptImage2AspectRatio::Portrait16x9,
    GptImage2EditImageSize::Auto => GptImage2AspectRatio::Square,
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

fn max_price_for_quality(quality: GptImage2EditImageQuality) -> u64 {
  PRICING_TABLE.iter().copied().map(|row| row.price_in_tenths_of_a_cent(quality)).max().expect("GPT Image 2 pricing table cannot be empty")
}

fn num_images(num_images: GptImage2EditImageNumImages) -> u64 {
  match num_images {
    GptImage2EditImageNumImages::One => 1,
    GptImage2EditImageNumImages::Two => 2,
    GptImage2EditImageNumImages::Three => 3,
    GptImage2EditImageNumImages::Four => 4,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  const QUALITIES: &[(GptImage2EditImageQuality, u64, u64, u64, u64, u64, u64)] = &[(GptImage2EditImageQuality::Low, 11, 15, 18, 17, 19, 24), (GptImage2EditImageQuality::Medium, 43, 61, 54, 53, 68, 113), (GptImage2EditImageQuality::High, 151, 219, 178, 158, 234, 413)];

  const PRESET_CASES: &[(GptImage2EditImageSize, u64)] = &[(GptImage2EditImageSize::Landscape4x3, 0), (GptImage2EditImageSize::Portrait4x3, 0), (GptImage2EditImageSize::Square, 1), (GptImage2EditImageSize::Landscape16x9, 3), (GptImage2EditImageSize::Portrait16x9, 3), (GptImage2EditImageSize::SquareHd, 4)];

  const RESOLUTION_CASES: &[(GptImage2EditImageSize, GptImage2Resolution, u64)] = &[
    (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::OneK, 0),
    (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::TwoK, 4),
    (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::ThreeK, 5),
    (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::FourK, 5),
    (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::OneK, 0),
    (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::TwoK, 3),
    (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::ThreeK, 4),
    (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::FourK, 5),
    (GptImage2EditImageSize::Portrait4x3, GptImage2Resolution::OneK, 0),
    (GptImage2EditImageSize::Portrait4x3, GptImage2Resolution::TwoK, 4),
    (GptImage2EditImageSize::Portrait4x3, GptImage2Resolution::ThreeK, 5),
    (GptImage2EditImageSize::Portrait4x3, GptImage2Resolution::FourK, 5),
    (GptImage2EditImageSize::Portrait16x9, GptImage2Resolution::OneK, 0),
    (GptImage2EditImageSize::Portrait16x9, GptImage2Resolution::TwoK, 3),
    (GptImage2EditImageSize::Portrait16x9, GptImage2Resolution::ThreeK, 4),
    (GptImage2EditImageSize::Portrait16x9, GptImage2Resolution::FourK, 5),
    (GptImage2EditImageSize::Square, GptImage2Resolution::OneK, 1),
    (GptImage2EditImageSize::Square, GptImage2Resolution::TwoK, 4),
    (GptImage2EditImageSize::Square, GptImage2Resolution::ThreeK, 5),
    (GptImage2EditImageSize::Square, GptImage2Resolution::FourK, 5),
    (GptImage2EditImageSize::SquareHd, GptImage2Resolution::OneK, 1),
    (GptImage2EditImageSize::SquareHd, GptImage2Resolution::TwoK, 4),
    (GptImage2EditImageSize::SquareHd, GptImage2Resolution::ThreeK, 5),
    (GptImage2EditImageSize::SquareHd, GptImage2Resolution::FourK, 5),
  ];

  const SPOT_PRICE_CASES: &[(GptImage2EditImageSize, GptImage2Resolution, GptImage2EditImageNumImages, u64)] = &[
    (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::OneK, GptImage2EditImageNumImages::One, 16),
    (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::TwoK, GptImage2EditImageNumImages::Two, 47),
    (GptImage2EditImageSize::Landscape4x3, GptImage2Resolution::ThreeK, GptImage2EditImageNumImages::Three, 124),
    (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::TwoK, GptImage2EditImageNumImages::Four, 64),
    (GptImage2EditImageSize::Landscape16x9, GptImage2Resolution::FourK, GptImage2EditImageNumImages::Two, 83),
    (GptImage2EditImageSize::Portrait4x3, GptImage2Resolution::TwoK, GptImage2EditImageNumImages::One, 24),
    (GptImage2EditImageSize::Portrait16x9, GptImage2Resolution::ThreeK, GptImage2EditImageNumImages::Three, 71),
    (GptImage2EditImageSize::Square, GptImage2Resolution::OneK, GptImage2EditImageNumImages::Four, 88),
    (GptImage2EditImageSize::Square, GptImage2Resolution::FourK, GptImage2EditImageNumImages::Four, 166),
    (GptImage2EditImageSize::SquareHd, GptImage2Resolution::TwoK, GptImage2EditImageNumImages::Three, 71),
  ];

  fn make_request(num_images: GptImage2EditImageNumImages, quality: Option<GptImage2EditImageQuality>, image_size: Option<GptImage2EditImageSize>, resolution: Option<GptImage2Resolution>) -> GptImage2EditImageRequest {
    GptImage2EditImageRequest { prompt: "test".to_string(), image_urls: vec!["https://example.com/image.png".to_string()], num_images, mask_url: None, image_size, quality, resolution, output_format: None }
  }

  #[test]
  fn cost_defaults_to_high_square() {
    assert_eq!(make_request(GptImage2EditImageNumImages::One, None, None, None).calculate_cost_in_cents(), 22);
  }

  #[test]
  fn cost_rounds_final_request_total_up_to_whole_cents() {
    assert_eq!(make_request(GptImage2EditImageNumImages::Four, Some(GptImage2EditImageQuality::Low), Some(GptImage2EditImageSize::Landscape4x3), None,).calculate_cost_in_cents(), 5,);
  }

  #[test]
  fn preset_pricing_matches_published_table() {
    for &(quality, landscape_4x3, square, portrait, landscape_16x9, square_hd, four_k) in QUALITIES {
      let expected_by_row = [landscape_4x3, square, portrait, landscape_16x9, square_hd, four_k];

      for &(size, row_index) in PRESET_CASES {
        let expected = expected_by_row[row_index as usize].div_ceil(10);
        assert_eq!(make_request(GptImage2EditImageNumImages::One, Some(quality), Some(size), None).calculate_cost_in_cents(), expected, "quality={quality:?} size={size:?}",);
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
        assert_eq!(make_request(GptImage2EditImageNumImages::One, Some(quality), Some(size), Some(resolution)).calculate_cost_in_cents(), expected, "quality={quality:?} size={size:?} resolution={resolution:?}",);
      }
    }
  }

  #[test]
  fn high_quality_spot_prices_match_expected_cents() {
    for &(size, resolution, num_images, expected) in SPOT_PRICE_CASES {
      assert_eq!(make_request(num_images, Some(GptImage2EditImageQuality::High), Some(size), Some(resolution)).calculate_cost_in_cents(), expected, "size={size:?} resolution={resolution:?} num_images={num_images:?}",);
    }
  }

  #[test]
  fn auto_uses_highest_published_price_for_quality() {
    assert_eq!(make_request(GptImage2EditImageNumImages::Two, Some(GptImage2EditImageQuality::High), Some(GptImage2EditImageSize::Auto), Some(GptImage2Resolution::OneK),).calculate_cost_in_cents(), 83,);
  }

  #[test]
  fn resolution_without_image_size_defaults_to_square_aspect() {
    assert_eq!(make_request(GptImage2EditImageNumImages::Two, Some(GptImage2EditImageQuality::High), None, Some(GptImage2Resolution::FourK),).calculate_cost_in_cents(), 83,);
  }
}
