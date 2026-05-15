use crate::requests::api::image::common::gpt_image_2_resolution::{
  compute_custom_image_size, GptImage2AspectRatio, GptImage2Resolution,
};
use crate::requests::api::image::text::gpt_image_2_text_to_image::api::{
  GptImage2TextToImageNumImages, GptImage2TextToImageQuality,
  GptImage2TextToImageRequest, GptImage2TextToImageSize,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for GptImage2TextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let quality = self.quality.unwrap_or(GptImage2TextToImageQuality::High);
    let total_pixels = estimate_total_pixels(self.image_size, self.resolution);
    let megapixels = total_pixels as f64 / 1_000_000.0;

    // Fal's GPT Image 2 text-to-image pricing has two components:
    //
    //   1. A base request cost (prompt processing, API overhead)
    //   2. A per-pixel generation cost that scales with output resolution
    //
    // Both components increase with quality level. All rates are in
    // tenths of a US cent, derived from Fal's published pricing.
    //
    // The base cost dominates at small resolutions (~1K); the per-pixel
    // cost dominates at large resolutions (~4K).
    let (base_tenths, per_megapixel_tenths): (f64, f64) = match quality {
      GptImage2TextToImageQuality::Low    => ( 8.0,  1.5),
      GptImage2TextToImageQuality::Medium => (35.0,  9.5),
      GptImage2TextToImageQuality::High   => (120.0, 35.0),
    };

    let tenths_per_image = (base_tenths + per_megapixel_tenths * megapixels).ceil() as u64;
    let cents_per_image = tenths_per_image.div_ceil(10);
    let num = num_images_u64(self.num_images);

    cents_per_image * num
  }
}

fn estimate_total_pixels(
  image_size: Option<GptImage2TextToImageSize>,
  resolution: Option<GptImage2Resolution>,
) -> u64 {
  match (image_size, resolution) {
    (Some(size), Some(res)) => {
      let aspect = size_to_aspect(size);
      let dims = compute_custom_image_size(aspect, res);
      dims.width as u64 * dims.height as u64
    }
    (None, Some(res)) => {
      let dims = compute_custom_image_size(GptImage2AspectRatio::Square, res);
      dims.width as u64 * dims.height as u64
    }
    (Some(size), None) => preset_pixel_count(size),
    (None, None) => preset_pixel_count(GptImage2TextToImageSize::Square),
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

/// Standard preset pixel counts when no custom resolution is specified.
fn preset_pixel_count(size: GptImage2TextToImageSize) -> u64 {
  match size {
    GptImage2TextToImageSize::Square       => 1024 * 1024,  // 1,048,576
    GptImage2TextToImageSize::SquareHd     => 2048 * 2048,  // 4,194,304
    GptImage2TextToImageSize::Landscape4x3 => 1024 * 768,   //   786,432
    GptImage2TextToImageSize::Landscape16x9 => 1920 * 1080, // 2,073,600
    GptImage2TextToImageSize::Portrait4x3  => 768 * 1024,   //   786,432
    GptImage2TextToImageSize::Portrait16x9 => 1080 * 1920,  // 2,073,600
  }
}

fn num_images_u64(num: GptImage2TextToImageNumImages) -> u64 {
  match num {
    GptImage2TextToImageNumImages::One => 1,
    GptImage2TextToImageNumImages::Two => 2,
    GptImage2TextToImageNumImages::Three => 3,
    GptImage2TextToImageNumImages::Four => 4,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: GptImage2TextToImageNumImages,
    quality: Option<GptImage2TextToImageQuality>,
    image_size: Option<GptImage2TextToImageSize>,
    resolution: Option<GptImage2Resolution>,
  ) -> GptImage2TextToImageRequest {
    GptImage2TextToImageRequest {
      prompt: "test".to_string(),
      num_images,
      image_size,
      resolution,
      quality,
      output_format: None,
    }
  }

  use GptImage2TextToImageNumImages::*;
  use GptImage2TextToImageQuality::*;
  use GptImage2TextToImageSize::*;
  use GptImage2Resolution::*;

  mod preset_pricing_tests {
    use super::*;

    // Table: (size, low, medium, high) — expected cents per image
    const PRESET_CASES: &[(GptImage2TextToImageSize, u64, u64, u64)] = &[
      //                              Low  Med  High
      (Landscape4x3,                   1,   5,   15),
      (Portrait4x3,                    1,   5,   15),
      (Square,                         1,   5,   16),
      (Landscape16x9,                  2,   6,   20),
      (Portrait16x9,                   2,   6,   20),
      (SquareHd,                       2,   8,   27),
    ];

    #[test]
    fn preset_costs_at_each_quality() {
      for &(size, expected_low, expected_med, expected_high) in PRESET_CASES {
        let cases = [
          (Low, expected_low),
          (Medium, expected_med),
          (High, expected_high),
        ];
        for (quality, expected) in cases {
          let actual = make_request(One, Some(quality), Some(size), None)
            .calculate_cost_in_cents();
          assert_eq!(actual, expected, "{size:?} {quality:?}");
        }
      }
    }

    #[test]
    fn defaults_to_high_quality_square() {
      assert_eq!(
        make_request(One, None, None, None).calculate_cost_in_cents(),
        16,
      );
    }
  }

  mod custom_resolution_pricing_tests {
    use super::*;

    // Table: (size, resolution, low, medium, high) — expected cents per image
    const RESOLUTION_CASES: &[(GptImage2TextToImageSize, GptImage2Resolution, u64, u64, u64)] = &[
      // Square aspect
      (Square, OneK,      1,   5,  16),
      (Square, TwoK,      2,   8,  27),
      (Square, ThreeK,    3,  12,  42),
      (Square, FourK,     3,  12,  42), // capped at max pixels

      // SquareHd (same aspect as Square)
      (SquareHd, OneK,    1,   5,  16),
      (SquareHd, TwoK,    2,   8,  27),
      (SquareHd, ThreeK,  3,  12,  42),
      (SquareHd, FourK,   3,  12,  42),

      // Landscape 4:3
      (Landscape4x3, OneK,    1,   5,  15),
      (Landscape4x3, TwoK,    2,   7,  24),
      (Landscape4x3, ThreeK,  2,  11,  37),
      (Landscape4x3, FourK,   3,  12,  41),

      // Landscape 16:9
      (Landscape16x9, OneK,   1,   5,  15),
      (Landscape16x9, TwoK,   2,   6,  21),
      (Landscape16x9, ThreeK, 2,   9,  31),
      (Landscape16x9, FourK,  3,  12,  42),

      // Portrait 4:3
      (Portrait4x3, OneK,    1,   5,  15),
      (Portrait4x3, TwoK,    2,   7,  24),
      (Portrait4x3, ThreeK,  2,  11,  37),
      (Portrait4x3, FourK,   3,  12,  41),

      // Portrait 16:9
      (Portrait16x9, OneK,   1,   5,  15),
      (Portrait16x9, TwoK,   2,   6,  21),
      (Portrait16x9, ThreeK, 2,   9,  31),
      (Portrait16x9, FourK,  3,  12,  42),
    ];

    #[test]
    fn resolution_costs_at_each_quality() {
      for &(size, res, expected_low, expected_med, expected_high) in RESOLUTION_CASES {
        let cases = [
          (Low, expected_low),
          (Medium, expected_med),
          (High, expected_high),
        ];
        for (quality, expected) in cases {
          let actual = make_request(One, Some(quality), Some(size), Some(res))
            .calculate_cost_in_cents();
          assert_eq!(actual, expected, "{size:?} {res:?} {quality:?}");
        }
      }
    }

    #[test]
    fn resolution_without_size_defaults_to_square() {
      assert_eq!(
        make_request(One, Some(High), None, Some(TwoK)).calculate_cost_in_cents(),
        make_request(One, Some(High), Some(Square), Some(TwoK)).calculate_cost_in_cents(),
      );
    }
  }

  mod num_images_tests {
    use super::*;

    const ALL_BATCH_SIZES: &[(GptImage2TextToImageNumImages, u64)] = &[
      (One, 1), (Two, 2), (Three, 3), (Four, 4),
    ];

    const ALL_SIZES: &[GptImage2TextToImageSize] = &[
      Square, SquareHd, Landscape4x3, Landscape16x9, Portrait4x3, Portrait16x9,
    ];

    const ALL_RESOLUTIONS: &[GptImage2Resolution] = &[OneK, TwoK, ThreeK, FourK];

    #[test]
    fn batch_scales_linearly_for_all_presets() {
      for &size in ALL_SIZES {
        let per_image = make_request(One, Some(High), Some(size), None)
          .calculate_cost_in_cents();
        for &(num, n) in ALL_BATCH_SIZES {
          let actual = make_request(num, Some(High), Some(size), None)
            .calculate_cost_in_cents();
          assert_eq!(actual, per_image * n, "{size:?} x{n}");
        }
      }
    }

    #[test]
    fn batch_scales_linearly_for_all_resolutions() {
      for &size in ALL_SIZES {
        for &res in ALL_RESOLUTIONS {
          let per_image = make_request(One, Some(High), Some(size), Some(res))
            .calculate_cost_in_cents();
          for &(num, n) in ALL_BATCH_SIZES {
            let actual = make_request(num, Some(High), Some(size), Some(res))
              .calculate_cost_in_cents();
            assert_eq!(actual, per_image * n, "{size:?} {res:?} x{n}");
          }
        }
      }
    }
  }

  mod exhaustive_preset_batch_tests {
    use super::*;

    // (size, quality, num_images, expected_cents)
    const CASES: &[(GptImage2TextToImageSize, GptImage2TextToImageQuality, GptImage2TextToImageNumImages, u64)] = &[
      (Square, Low, One, 1), (Square, Low, Two, 2), (Square, Low, Three, 3), (Square, Low, Four, 4),
      (Square, Medium, One, 5), (Square, Medium, Two, 10), (Square, Medium, Three, 15), (Square, Medium, Four, 20),
      (Square, High, One, 16), (Square, High, Two, 32), (Square, High, Three, 48), (Square, High, Four, 64),
      (SquareHd, Low, One, 2), (SquareHd, Low, Two, 4), (SquareHd, Low, Three, 6), (SquareHd, Low, Four, 8),
      (SquareHd, Medium, One, 8), (SquareHd, Medium, Two, 16), (SquareHd, Medium, Three, 24), (SquareHd, Medium, Four, 32),
      (SquareHd, High, One, 27), (SquareHd, High, Two, 54), (SquareHd, High, Three, 81), (SquareHd, High, Four, 108),
      (Landscape4x3, Low, One, 1), (Landscape4x3, Low, Two, 2), (Landscape4x3, Low, Three, 3), (Landscape4x3, Low, Four, 4),
      (Landscape4x3, Medium, One, 5), (Landscape4x3, Medium, Two, 10), (Landscape4x3, Medium, Three, 15), (Landscape4x3, Medium, Four, 20),
      (Landscape4x3, High, One, 15), (Landscape4x3, High, Two, 30), (Landscape4x3, High, Three, 45), (Landscape4x3, High, Four, 60),
      (Landscape16x9, Low, One, 2), (Landscape16x9, Low, Two, 4), (Landscape16x9, Low, Three, 6), (Landscape16x9, Low, Four, 8),
      (Landscape16x9, Medium, One, 6), (Landscape16x9, Medium, Two, 12), (Landscape16x9, Medium, Three, 18), (Landscape16x9, Medium, Four, 24),
      (Landscape16x9, High, One, 20), (Landscape16x9, High, Two, 40), (Landscape16x9, High, Three, 60), (Landscape16x9, High, Four, 80),
      (Portrait4x3, Low, One, 1), (Portrait4x3, Low, Two, 2), (Portrait4x3, Low, Three, 3), (Portrait4x3, Low, Four, 4),
      (Portrait4x3, Medium, One, 5), (Portrait4x3, Medium, Two, 10), (Portrait4x3, Medium, Three, 15), (Portrait4x3, Medium, Four, 20),
      (Portrait4x3, High, One, 15), (Portrait4x3, High, Two, 30), (Portrait4x3, High, Three, 45), (Portrait4x3, High, Four, 60),
      (Portrait16x9, Low, One, 2), (Portrait16x9, Low, Two, 4), (Portrait16x9, Low, Three, 6), (Portrait16x9, Low, Four, 8),
      (Portrait16x9, Medium, One, 6), (Portrait16x9, Medium, Two, 12), (Portrait16x9, Medium, Three, 18), (Portrait16x9, Medium, Four, 24),
      (Portrait16x9, High, One, 20), (Portrait16x9, High, Two, 40), (Portrait16x9, High, Three, 60), (Portrait16x9, High, Four, 80),
    ];

    #[test]
    fn all_preset_batch_costs() {
      for &(size, quality, num, expected) in CASES {
        let actual = make_request(num, Some(quality), Some(size), None).calculate_cost_in_cents();
        assert_eq!(actual, expected, "{size:?} {quality:?} {num:?}");
      }
    }
  }

  mod exhaustive_resolution_batch_tests {
    use super::*;

    // (size, resolution, quality, num_images, expected_cents)
    const CASES: &[(GptImage2TextToImageSize, GptImage2Resolution, GptImage2TextToImageQuality, GptImage2TextToImageNumImages, u64)] = &[
      // Square
      (Square, OneK, Low, One, 1), (Square, OneK, Low, Two, 2), (Square, OneK, Low, Three, 3), (Square, OneK, Low, Four, 4),
      (Square, OneK, Medium, One, 5), (Square, OneK, Medium, Two, 10), (Square, OneK, Medium, Three, 15), (Square, OneK, Medium, Four, 20),
      (Square, OneK, High, One, 16), (Square, OneK, High, Two, 32), (Square, OneK, High, Three, 48), (Square, OneK, High, Four, 64),
      (Square, TwoK, Low, One, 2), (Square, TwoK, Low, Two, 4), (Square, TwoK, Low, Three, 6), (Square, TwoK, Low, Four, 8),
      (Square, TwoK, Medium, One, 8), (Square, TwoK, Medium, Two, 16), (Square, TwoK, Medium, Three, 24), (Square, TwoK, Medium, Four, 32),
      (Square, TwoK, High, One, 27), (Square, TwoK, High, Two, 54), (Square, TwoK, High, Three, 81), (Square, TwoK, High, Four, 108),
      (Square, ThreeK, Low, One, 3), (Square, ThreeK, Low, Two, 6), (Square, ThreeK, Low, Three, 9), (Square, ThreeK, Low, Four, 12),
      (Square, ThreeK, Medium, One, 12), (Square, ThreeK, Medium, Two, 24), (Square, ThreeK, Medium, Three, 36), (Square, ThreeK, Medium, Four, 48),
      (Square, ThreeK, High, One, 42), (Square, ThreeK, High, Two, 84), (Square, ThreeK, High, Three, 126), (Square, ThreeK, High, Four, 168),
      (Square, FourK, Low, One, 3), (Square, FourK, Low, Two, 6), (Square, FourK, Low, Three, 9), (Square, FourK, Low, Four, 12),
      (Square, FourK, Medium, One, 12), (Square, FourK, Medium, Two, 24), (Square, FourK, Medium, Three, 36), (Square, FourK, Medium, Four, 48),
      (Square, FourK, High, One, 42), (Square, FourK, High, Two, 84), (Square, FourK, High, Three, 126), (Square, FourK, High, Four, 168),
      // SquareHd
      (SquareHd, OneK, Low, One, 1), (SquareHd, OneK, Low, Two, 2), (SquareHd, OneK, Low, Three, 3), (SquareHd, OneK, Low, Four, 4),
      (SquareHd, OneK, Medium, One, 5), (SquareHd, OneK, Medium, Two, 10), (SquareHd, OneK, Medium, Three, 15), (SquareHd, OneK, Medium, Four, 20),
      (SquareHd, OneK, High, One, 16), (SquareHd, OneK, High, Two, 32), (SquareHd, OneK, High, Three, 48), (SquareHd, OneK, High, Four, 64),
      (SquareHd, TwoK, Low, One, 2), (SquareHd, TwoK, Low, Two, 4), (SquareHd, TwoK, Low, Three, 6), (SquareHd, TwoK, Low, Four, 8),
      (SquareHd, TwoK, Medium, One, 8), (SquareHd, TwoK, Medium, Two, 16), (SquareHd, TwoK, Medium, Three, 24), (SquareHd, TwoK, Medium, Four, 32),
      (SquareHd, TwoK, High, One, 27), (SquareHd, TwoK, High, Two, 54), (SquareHd, TwoK, High, Three, 81), (SquareHd, TwoK, High, Four, 108),
      (SquareHd, ThreeK, Low, One, 3), (SquareHd, ThreeK, Low, Two, 6), (SquareHd, ThreeK, Low, Three, 9), (SquareHd, ThreeK, Low, Four, 12),
      (SquareHd, ThreeK, Medium, One, 12), (SquareHd, ThreeK, Medium, Two, 24), (SquareHd, ThreeK, Medium, Three, 36), (SquareHd, ThreeK, Medium, Four, 48),
      (SquareHd, ThreeK, High, One, 42), (SquareHd, ThreeK, High, Two, 84), (SquareHd, ThreeK, High, Three, 126), (SquareHd, ThreeK, High, Four, 168),
      (SquareHd, FourK, Low, One, 3), (SquareHd, FourK, Low, Two, 6), (SquareHd, FourK, Low, Three, 9), (SquareHd, FourK, Low, Four, 12),
      (SquareHd, FourK, Medium, One, 12), (SquareHd, FourK, Medium, Two, 24), (SquareHd, FourK, Medium, Three, 36), (SquareHd, FourK, Medium, Four, 48),
      (SquareHd, FourK, High, One, 42), (SquareHd, FourK, High, Two, 84), (SquareHd, FourK, High, Three, 126), (SquareHd, FourK, High, Four, 168),
      // Landscape4x3
      (Landscape4x3, OneK, Low, One, 1), (Landscape4x3, OneK, Low, Two, 2), (Landscape4x3, OneK, Low, Three, 3), (Landscape4x3, OneK, Low, Four, 4),
      (Landscape4x3, OneK, Medium, One, 5), (Landscape4x3, OneK, Medium, Two, 10), (Landscape4x3, OneK, Medium, Three, 15), (Landscape4x3, OneK, Medium, Four, 20),
      (Landscape4x3, OneK, High, One, 15), (Landscape4x3, OneK, High, Two, 30), (Landscape4x3, OneK, High, Three, 45), (Landscape4x3, OneK, High, Four, 60),
      (Landscape4x3, TwoK, Low, One, 2), (Landscape4x3, TwoK, Low, Two, 4), (Landscape4x3, TwoK, Low, Three, 6), (Landscape4x3, TwoK, Low, Four, 8),
      (Landscape4x3, TwoK, Medium, One, 7), (Landscape4x3, TwoK, Medium, Two, 14), (Landscape4x3, TwoK, Medium, Three, 21), (Landscape4x3, TwoK, Medium, Four, 28),
      (Landscape4x3, TwoK, High, One, 24), (Landscape4x3, TwoK, High, Two, 48), (Landscape4x3, TwoK, High, Three, 72), (Landscape4x3, TwoK, High, Four, 96),
      (Landscape4x3, ThreeK, Low, One, 2), (Landscape4x3, ThreeK, Low, Two, 4), (Landscape4x3, ThreeK, Low, Three, 6), (Landscape4x3, ThreeK, Low, Four, 8),
      (Landscape4x3, ThreeK, Medium, One, 11), (Landscape4x3, ThreeK, Medium, Two, 22), (Landscape4x3, ThreeK, Medium, Three, 33), (Landscape4x3, ThreeK, Medium, Four, 44),
      (Landscape4x3, ThreeK, High, One, 37), (Landscape4x3, ThreeK, High, Two, 74), (Landscape4x3, ThreeK, High, Three, 111), (Landscape4x3, ThreeK, High, Four, 148),
      (Landscape4x3, FourK, Low, One, 3), (Landscape4x3, FourK, Low, Two, 6), (Landscape4x3, FourK, Low, Three, 9), (Landscape4x3, FourK, Low, Four, 12),
      (Landscape4x3, FourK, Medium, One, 12), (Landscape4x3, FourK, Medium, Two, 24), (Landscape4x3, FourK, Medium, Three, 36), (Landscape4x3, FourK, Medium, Four, 48),
      (Landscape4x3, FourK, High, One, 41), (Landscape4x3, FourK, High, Two, 82), (Landscape4x3, FourK, High, Three, 123), (Landscape4x3, FourK, High, Four, 164),
      // Landscape16x9
      (Landscape16x9, OneK, Low, One, 1), (Landscape16x9, OneK, Low, Two, 2), (Landscape16x9, OneK, Low, Three, 3), (Landscape16x9, OneK, Low, Four, 4),
      (Landscape16x9, OneK, Medium, One, 5), (Landscape16x9, OneK, Medium, Two, 10), (Landscape16x9, OneK, Medium, Three, 15), (Landscape16x9, OneK, Medium, Four, 20),
      (Landscape16x9, OneK, High, One, 15), (Landscape16x9, OneK, High, Two, 30), (Landscape16x9, OneK, High, Three, 45), (Landscape16x9, OneK, High, Four, 60),
      (Landscape16x9, TwoK, Low, One, 2), (Landscape16x9, TwoK, Low, Two, 4), (Landscape16x9, TwoK, Low, Three, 6), (Landscape16x9, TwoK, Low, Four, 8),
      (Landscape16x9, TwoK, Medium, One, 6), (Landscape16x9, TwoK, Medium, Two, 12), (Landscape16x9, TwoK, Medium, Three, 18), (Landscape16x9, TwoK, Medium, Four, 24),
      (Landscape16x9, TwoK, High, One, 21), (Landscape16x9, TwoK, High, Two, 42), (Landscape16x9, TwoK, High, Three, 63), (Landscape16x9, TwoK, High, Four, 84),
      (Landscape16x9, ThreeK, Low, One, 2), (Landscape16x9, ThreeK, Low, Two, 4), (Landscape16x9, ThreeK, Low, Three, 6), (Landscape16x9, ThreeK, Low, Four, 8),
      (Landscape16x9, ThreeK, Medium, One, 9), (Landscape16x9, ThreeK, Medium, Two, 18), (Landscape16x9, ThreeK, Medium, Three, 27), (Landscape16x9, ThreeK, Medium, Four, 36),
      (Landscape16x9, ThreeK, High, One, 31), (Landscape16x9, ThreeK, High, Two, 62), (Landscape16x9, ThreeK, High, Three, 93), (Landscape16x9, ThreeK, High, Four, 124),
      (Landscape16x9, FourK, Low, One, 3), (Landscape16x9, FourK, Low, Two, 6), (Landscape16x9, FourK, Low, Three, 9), (Landscape16x9, FourK, Low, Four, 12),
      (Landscape16x9, FourK, Medium, One, 12), (Landscape16x9, FourK, Medium, Two, 24), (Landscape16x9, FourK, Medium, Three, 36), (Landscape16x9, FourK, Medium, Four, 48),
      (Landscape16x9, FourK, High, One, 42), (Landscape16x9, FourK, High, Two, 84), (Landscape16x9, FourK, High, Three, 126), (Landscape16x9, FourK, High, Four, 168),
      // Portrait4x3
      (Portrait4x3, OneK, Low, One, 1), (Portrait4x3, OneK, Low, Two, 2), (Portrait4x3, OneK, Low, Three, 3), (Portrait4x3, OneK, Low, Four, 4),
      (Portrait4x3, OneK, Medium, One, 5), (Portrait4x3, OneK, Medium, Two, 10), (Portrait4x3, OneK, Medium, Three, 15), (Portrait4x3, OneK, Medium, Four, 20),
      (Portrait4x3, OneK, High, One, 15), (Portrait4x3, OneK, High, Two, 30), (Portrait4x3, OneK, High, Three, 45), (Portrait4x3, OneK, High, Four, 60),
      (Portrait4x3, TwoK, Low, One, 2), (Portrait4x3, TwoK, Low, Two, 4), (Portrait4x3, TwoK, Low, Three, 6), (Portrait4x3, TwoK, Low, Four, 8),
      (Portrait4x3, TwoK, Medium, One, 7), (Portrait4x3, TwoK, Medium, Two, 14), (Portrait4x3, TwoK, Medium, Three, 21), (Portrait4x3, TwoK, Medium, Four, 28),
      (Portrait4x3, TwoK, High, One, 24), (Portrait4x3, TwoK, High, Two, 48), (Portrait4x3, TwoK, High, Three, 72), (Portrait4x3, TwoK, High, Four, 96),
      (Portrait4x3, ThreeK, Low, One, 2), (Portrait4x3, ThreeK, Low, Two, 4), (Portrait4x3, ThreeK, Low, Three, 6), (Portrait4x3, ThreeK, Low, Four, 8),
      (Portrait4x3, ThreeK, Medium, One, 11), (Portrait4x3, ThreeK, Medium, Two, 22), (Portrait4x3, ThreeK, Medium, Three, 33), (Portrait4x3, ThreeK, Medium, Four, 44),
      (Portrait4x3, ThreeK, High, One, 37), (Portrait4x3, ThreeK, High, Two, 74), (Portrait4x3, ThreeK, High, Three, 111), (Portrait4x3, ThreeK, High, Four, 148),
      (Portrait4x3, FourK, Low, One, 3), (Portrait4x3, FourK, Low, Two, 6), (Portrait4x3, FourK, Low, Three, 9), (Portrait4x3, FourK, Low, Four, 12),
      (Portrait4x3, FourK, Medium, One, 12), (Portrait4x3, FourK, Medium, Two, 24), (Portrait4x3, FourK, Medium, Three, 36), (Portrait4x3, FourK, Medium, Four, 48),
      (Portrait4x3, FourK, High, One, 41), (Portrait4x3, FourK, High, Two, 82), (Portrait4x3, FourK, High, Three, 123), (Portrait4x3, FourK, High, Four, 164),
      // Portrait16x9
      (Portrait16x9, OneK, Low, One, 1), (Portrait16x9, OneK, Low, Two, 2), (Portrait16x9, OneK, Low, Three, 3), (Portrait16x9, OneK, Low, Four, 4),
      (Portrait16x9, OneK, Medium, One, 5), (Portrait16x9, OneK, Medium, Two, 10), (Portrait16x9, OneK, Medium, Three, 15), (Portrait16x9, OneK, Medium, Four, 20),
      (Portrait16x9, OneK, High, One, 15), (Portrait16x9, OneK, High, Two, 30), (Portrait16x9, OneK, High, Three, 45), (Portrait16x9, OneK, High, Four, 60),
      (Portrait16x9, TwoK, Low, One, 2), (Portrait16x9, TwoK, Low, Two, 4), (Portrait16x9, TwoK, Low, Three, 6), (Portrait16x9, TwoK, Low, Four, 8),
      (Portrait16x9, TwoK, Medium, One, 6), (Portrait16x9, TwoK, Medium, Two, 12), (Portrait16x9, TwoK, Medium, Three, 18), (Portrait16x9, TwoK, Medium, Four, 24),
      (Portrait16x9, TwoK, High, One, 21), (Portrait16x9, TwoK, High, Two, 42), (Portrait16x9, TwoK, High, Three, 63), (Portrait16x9, TwoK, High, Four, 84),
      (Portrait16x9, ThreeK, Low, One, 2), (Portrait16x9, ThreeK, Low, Two, 4), (Portrait16x9, ThreeK, Low, Three, 6), (Portrait16x9, ThreeK, Low, Four, 8),
      (Portrait16x9, ThreeK, Medium, One, 9), (Portrait16x9, ThreeK, Medium, Two, 18), (Portrait16x9, ThreeK, Medium, Three, 27), (Portrait16x9, ThreeK, Medium, Four, 36),
      (Portrait16x9, ThreeK, High, One, 31), (Portrait16x9, ThreeK, High, Two, 62), (Portrait16x9, ThreeK, High, Three, 93), (Portrait16x9, ThreeK, High, Four, 124),
      (Portrait16x9, FourK, Low, One, 3), (Portrait16x9, FourK, Low, Two, 6), (Portrait16x9, FourK, Low, Three, 9), (Portrait16x9, FourK, Low, Four, 12),
      (Portrait16x9, FourK, Medium, One, 12), (Portrait16x9, FourK, Medium, Two, 24), (Portrait16x9, FourK, Medium, Three, 36), (Portrait16x9, FourK, Medium, Four, 48),
      (Portrait16x9, FourK, High, One, 42), (Portrait16x9, FourK, High, Two, 84), (Portrait16x9, FourK, High, Three, 126), (Portrait16x9, FourK, High, Four, 168),
    ];

    #[test]
    fn all_resolution_batch_costs() {
      for &(size, res, quality, num, expected) in CASES {
        let actual = make_request(num, Some(quality), Some(size), Some(res)).calculate_cost_in_cents();
        assert_eq!(actual, expected, "{size:?} {res:?} {quality:?} {num:?}");
      }
    }
  }

  mod monotonicity_tests {
    use super::*;

    #[test]
    fn higher_quality_costs_more() {
      for &size in &[Square, Landscape16x9, Portrait4x3] {
        let low = make_request(One, Some(Low), Some(size), None).calculate_cost_in_cents();
        let med = make_request(One, Some(Medium), Some(size), None).calculate_cost_in_cents();
        let high = make_request(One, Some(High), Some(size), None).calculate_cost_in_cents();
        assert!(low <= med, "{size:?}: low ({low}) should be <= medium ({med})");
        assert!(med <= high, "{size:?}: medium ({med}) should be <= high ({high})");
      }
    }

    #[test]
    fn higher_resolution_costs_at_least_as_much() {
      for &size in &[Square, Landscape16x9, Portrait4x3] {
        let resolutions = [OneK, TwoK, ThreeK, FourK];
        for pair in resolutions.windows(2) {
          let lower = make_request(One, Some(High), Some(size), Some(pair[0]))
            .calculate_cost_in_cents();
          let higher = make_request(One, Some(High), Some(size), Some(pair[1]))
            .calculate_cost_in_cents();
          assert!(
            lower <= higher,
            "{size:?}: {pair:?} — lower res ({lower}¢) should be <= higher res ({higher}¢)",
          );
        }
      }
    }
  }
}
