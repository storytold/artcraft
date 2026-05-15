use crate::requests::api::image::common::gpt_image_2_resolution::{
  compute_custom_image_size, GptImage2AspectRatio, GptImage2Resolution,
};
use crate::requests::api::image::edit::gpt_image_2_edit_image::api::{
  GptImage2EditImageNumImages, GptImage2EditImageQuality,
  GptImage2EditImageRequest, GptImage2EditImageSize,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for GptImage2EditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let quality = self.quality.unwrap_or(GptImage2EditImageQuality::High);
    let total_pixels = estimate_total_pixels(self.image_size, self.resolution);
    let megapixels = total_pixels as f64 / 1_000_000.0;

    // Fal's GPT Image 2 edit-image pricing has two components:
    //
    //   1. A base request cost (prompt processing, API overhead)
    //   2. A per-pixel generation cost that scales with output resolution
    //
    // Both components increase with quality level. All rates are in
    // tenths of a US cent, derived from Fal's published pricing.
    //
    // Edit-image is slightly cheaper than text-to-image at the base level,
    // but scales at a similar per-pixel rate at medium and high quality.
    let (base_tenths, per_megapixel_tenths): (f64, f64) = match quality {
      GptImage2EditImageQuality::Low    => ( 3.0,  1.0),
      GptImage2EditImageQuality::Medium => (25.0,  9.0),
      GptImage2EditImageQuality::High   => (110.0, 35.0),
    };

    let tenths_per_image = (base_tenths + per_megapixel_tenths * megapixels).ceil() as u64;
    let cents_per_image = tenths_per_image.div_ceil(10);
    let num = num_images_u64(self.num_images);

    cents_per_image * num
  }
}

fn estimate_total_pixels(
  image_size: Option<GptImage2EditImageSize>,
  resolution: Option<GptImage2Resolution>,
) -> u64 {
  match (image_size, resolution) {
    // Auto: no meaningful aspect ratio, use conservative max-size estimate
    (Some(GptImage2EditImageSize::Auto), _) => 3840 * 2160, // 8,294,400
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
    (None, None) => preset_pixel_count(GptImage2EditImageSize::Square),
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

/// Standard preset pixel counts when no custom resolution is specified.
fn preset_pixel_count(size: GptImage2EditImageSize) -> u64 {
  match size {
    GptImage2EditImageSize::Square       => 1024 * 1024,  // 1,048,576
    GptImage2EditImageSize::SquareHd     => 2048 * 2048,  // 4,194,304
    GptImage2EditImageSize::Landscape4x3 => 1024 * 768,   //   786,432
    GptImage2EditImageSize::Landscape16x9 => 1920 * 1080, // 2,073,600
    GptImage2EditImageSize::Portrait4x3  => 768 * 1024,   //   786,432
    GptImage2EditImageSize::Portrait16x9 => 1080 * 1920,  // 2,073,600
    GptImage2EditImageSize::Auto         => 3840 * 2160,  // 8,294,400 (conservative)
  }
}

fn num_images_u64(num: GptImage2EditImageNumImages) -> u64 {
  match num {
    GptImage2EditImageNumImages::One => 1,
    GptImage2EditImageNumImages::Two => 2,
    GptImage2EditImageNumImages::Three => 3,
    GptImage2EditImageNumImages::Four => 4,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: GptImage2EditImageNumImages,
    quality: Option<GptImage2EditImageQuality>,
    image_size: Option<GptImage2EditImageSize>,
    resolution: Option<GptImage2Resolution>,
  ) -> GptImage2EditImageRequest {
    GptImage2EditImageRequest {
      prompt: "test".to_string(),
      image_urls: vec!["https://example.com/image.png".to_string()],
      num_images,
      mask_url: None,
      image_size,
      resolution,
      quality,
      output_format: None,
    }
  }

  use GptImage2EditImageNumImages::*;
  use GptImage2EditImageQuality::*;
  use GptImage2EditImageSize::*;
  use GptImage2Resolution::*;

  mod preset_pricing_tests {
    use super::*;

    // Table: (size, low, medium, high) — expected cents per image
    const PRESET_CASES: &[(GptImage2EditImageSize, u64, u64, u64)] = &[
      //                              Low  Med  High
      (Landscape4x3,                   1,   4,  14),
      (Portrait4x3,                    1,   4,  14),
      (Square,                         1,   4,  15),
      (Landscape16x9,                  1,   5,  19),
      (Portrait16x9,                   1,   5,  19),
      (SquareHd,                       1,   7,  26),
      (Auto,                           2,  10,  41),
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
        15,
      );
    }
  }

  mod custom_resolution_pricing_tests {
    use super::*;

    // Table: (size, resolution, low, medium, high) — expected cents per image
    const RESOLUTION_CASES: &[(GptImage2EditImageSize, GptImage2Resolution, u64, u64, u64)] = &[
      // Square aspect
      (Square, OneK,      1,   4,  15),
      (Square, TwoK,      1,   7,  26),
      (Square, ThreeK,    2,  10,  41),
      (Square, FourK,     2,  10,  41), // capped at max pixels

      // SquareHd (same aspect as Square)
      (SquareHd, OneK,    1,   4,  15),
      (SquareHd, TwoK,    1,   7,  26),
      (SquareHd, ThreeK,  2,  10,  41),
      (SquareHd, FourK,   2,  10,  41),

      // Landscape 4:3
      (Landscape4x3, OneK,    1,   4,  14),
      (Landscape4x3, TwoK,    1,   6,  23),
      (Landscape4x3, ThreeK,  2,   9,  36),
      (Landscape4x3, FourK,   2,  10,  40),

      // Landscape 16:9
      (Landscape16x9, OneK,   1,   4,  14),
      (Landscape16x9, TwoK,   1,   5,  20),
      (Landscape16x9, ThreeK, 1,   8,  30),
      (Landscape16x9, FourK,  2,  10,  41),

      // Portrait 4:3
      (Portrait4x3, OneK,    1,   4,  14),
      (Portrait4x3, TwoK,    1,   6,  23),
      (Portrait4x3, ThreeK,  2,   9,  36),
      (Portrait4x3, FourK,   2,  10,  40),

      // Portrait 16:9
      (Portrait16x9, OneK,   1,   4,  14),
      (Portrait16x9, TwoK,   1,   5,  20),
      (Portrait16x9, ThreeK, 1,   8,  30),
      (Portrait16x9, FourK,  2,  10,  41),
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

    #[test]
    fn auto_ignores_resolution_and_uses_max_estimate() {
      // Auto always uses the conservative 3840x2160 estimate
      let auto_cost = make_request(One, Some(High), Some(Auto), Some(OneK))
        .calculate_cost_in_cents();
      let auto_no_res = make_request(One, Some(High), Some(Auto), None)
        .calculate_cost_in_cents();
      assert_eq!(auto_cost, auto_no_res);
    }
  }

  mod num_images_tests {
    use super::*;

    const ALL_BATCH_SIZES: &[(GptImage2EditImageNumImages, u64)] = &[
      (One, 1), (Two, 2), (Three, 3), (Four, 4),
    ];

    const ALL_SIZES: &[GptImage2EditImageSize] = &[
      Square, SquareHd, Landscape4x3, Landscape16x9, Portrait4x3, Portrait16x9, Auto,
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
      for &size in &[Square, SquareHd, Landscape4x3, Landscape16x9, Portrait4x3, Portrait16x9] {
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
    const CASES: &[(GptImage2EditImageSize, GptImage2EditImageQuality, GptImage2EditImageNumImages, u64)] = &[
      (Square, Low, One, 1), (Square, Low, Two, 2), (Square, Low, Three, 3), (Square, Low, Four, 4),
      (Square, Medium, One, 4), (Square, Medium, Two, 8), (Square, Medium, Three, 12), (Square, Medium, Four, 16),
      (Square, High, One, 15), (Square, High, Two, 30), (Square, High, Three, 45), (Square, High, Four, 60),
      (SquareHd, Low, One, 1), (SquareHd, Low, Two, 2), (SquareHd, Low, Three, 3), (SquareHd, Low, Four, 4),
      (SquareHd, Medium, One, 7), (SquareHd, Medium, Two, 14), (SquareHd, Medium, Three, 21), (SquareHd, Medium, Four, 28),
      (SquareHd, High, One, 26), (SquareHd, High, Two, 52), (SquareHd, High, Three, 78), (SquareHd, High, Four, 104),
      (Landscape4x3, Low, One, 1), (Landscape4x3, Low, Two, 2), (Landscape4x3, Low, Three, 3), (Landscape4x3, Low, Four, 4),
      (Landscape4x3, Medium, One, 4), (Landscape4x3, Medium, Two, 8), (Landscape4x3, Medium, Three, 12), (Landscape4x3, Medium, Four, 16),
      (Landscape4x3, High, One, 14), (Landscape4x3, High, Two, 28), (Landscape4x3, High, Three, 42), (Landscape4x3, High, Four, 56),
      (Landscape16x9, Low, One, 1), (Landscape16x9, Low, Two, 2), (Landscape16x9, Low, Three, 3), (Landscape16x9, Low, Four, 4),
      (Landscape16x9, Medium, One, 5), (Landscape16x9, Medium, Two, 10), (Landscape16x9, Medium, Three, 15), (Landscape16x9, Medium, Four, 20),
      (Landscape16x9, High, One, 19), (Landscape16x9, High, Two, 38), (Landscape16x9, High, Three, 57), (Landscape16x9, High, Four, 76),
      (Portrait4x3, Low, One, 1), (Portrait4x3, Low, Two, 2), (Portrait4x3, Low, Three, 3), (Portrait4x3, Low, Four, 4),
      (Portrait4x3, Medium, One, 4), (Portrait4x3, Medium, Two, 8), (Portrait4x3, Medium, Three, 12), (Portrait4x3, Medium, Four, 16),
      (Portrait4x3, High, One, 14), (Portrait4x3, High, Two, 28), (Portrait4x3, High, Three, 42), (Portrait4x3, High, Four, 56),
      (Portrait16x9, Low, One, 1), (Portrait16x9, Low, Two, 2), (Portrait16x9, Low, Three, 3), (Portrait16x9, Low, Four, 4),
      (Portrait16x9, Medium, One, 5), (Portrait16x9, Medium, Two, 10), (Portrait16x9, Medium, Three, 15), (Portrait16x9, Medium, Four, 20),
      (Portrait16x9, High, One, 19), (Portrait16x9, High, Two, 38), (Portrait16x9, High, Three, 57), (Portrait16x9, High, Four, 76),
      (Auto, Low, One, 2), (Auto, Low, Two, 4), (Auto, Low, Three, 6), (Auto, Low, Four, 8),
      (Auto, Medium, One, 10), (Auto, Medium, Two, 20), (Auto, Medium, Three, 30), (Auto, Medium, Four, 40),
      (Auto, High, One, 41), (Auto, High, Two, 82), (Auto, High, Three, 123), (Auto, High, Four, 164),
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
    const CASES: &[(GptImage2EditImageSize, GptImage2Resolution, GptImage2EditImageQuality, GptImage2EditImageNumImages, u64)] = &[
      // Square
      (Square, OneK, Low, One, 1), (Square, OneK, Low, Two, 2), (Square, OneK, Low, Three, 3), (Square, OneK, Low, Four, 4),
      (Square, OneK, Medium, One, 4), (Square, OneK, Medium, Two, 8), (Square, OneK, Medium, Three, 12), (Square, OneK, Medium, Four, 16),
      (Square, OneK, High, One, 15), (Square, OneK, High, Two, 30), (Square, OneK, High, Three, 45), (Square, OneK, High, Four, 60),
      (Square, TwoK, Low, One, 1), (Square, TwoK, Low, Two, 2), (Square, TwoK, Low, Three, 3), (Square, TwoK, Low, Four, 4),
      (Square, TwoK, Medium, One, 7), (Square, TwoK, Medium, Two, 14), (Square, TwoK, Medium, Three, 21), (Square, TwoK, Medium, Four, 28),
      (Square, TwoK, High, One, 26), (Square, TwoK, High, Two, 52), (Square, TwoK, High, Three, 78), (Square, TwoK, High, Four, 104),
      (Square, ThreeK, Low, One, 2), (Square, ThreeK, Low, Two, 4), (Square, ThreeK, Low, Three, 6), (Square, ThreeK, Low, Four, 8),
      (Square, ThreeK, Medium, One, 10), (Square, ThreeK, Medium, Two, 20), (Square, ThreeK, Medium, Three, 30), (Square, ThreeK, Medium, Four, 40),
      (Square, ThreeK, High, One, 41), (Square, ThreeK, High, Two, 82), (Square, ThreeK, High, Three, 123), (Square, ThreeK, High, Four, 164),
      (Square, FourK, Low, One, 2), (Square, FourK, Low, Two, 4), (Square, FourK, Low, Three, 6), (Square, FourK, Low, Four, 8),
      (Square, FourK, Medium, One, 10), (Square, FourK, Medium, Two, 20), (Square, FourK, Medium, Three, 30), (Square, FourK, Medium, Four, 40),
      (Square, FourK, High, One, 41), (Square, FourK, High, Two, 82), (Square, FourK, High, Three, 123), (Square, FourK, High, Four, 164),
      // SquareHd
      (SquareHd, OneK, Low, One, 1), (SquareHd, OneK, Low, Two, 2), (SquareHd, OneK, Low, Three, 3), (SquareHd, OneK, Low, Four, 4),
      (SquareHd, OneK, Medium, One, 4), (SquareHd, OneK, Medium, Two, 8), (SquareHd, OneK, Medium, Three, 12), (SquareHd, OneK, Medium, Four, 16),
      (SquareHd, OneK, High, One, 15), (SquareHd, OneK, High, Two, 30), (SquareHd, OneK, High, Three, 45), (SquareHd, OneK, High, Four, 60),
      (SquareHd, TwoK, Low, One, 1), (SquareHd, TwoK, Low, Two, 2), (SquareHd, TwoK, Low, Three, 3), (SquareHd, TwoK, Low, Four, 4),
      (SquareHd, TwoK, Medium, One, 7), (SquareHd, TwoK, Medium, Two, 14), (SquareHd, TwoK, Medium, Three, 21), (SquareHd, TwoK, Medium, Four, 28),
      (SquareHd, TwoK, High, One, 26), (SquareHd, TwoK, High, Two, 52), (SquareHd, TwoK, High, Three, 78), (SquareHd, TwoK, High, Four, 104),
      (SquareHd, ThreeK, Low, One, 2), (SquareHd, ThreeK, Low, Two, 4), (SquareHd, ThreeK, Low, Three, 6), (SquareHd, ThreeK, Low, Four, 8),
      (SquareHd, ThreeK, Medium, One, 10), (SquareHd, ThreeK, Medium, Two, 20), (SquareHd, ThreeK, Medium, Three, 30), (SquareHd, ThreeK, Medium, Four, 40),
      (SquareHd, ThreeK, High, One, 41), (SquareHd, ThreeK, High, Two, 82), (SquareHd, ThreeK, High, Three, 123), (SquareHd, ThreeK, High, Four, 164),
      (SquareHd, FourK, Low, One, 2), (SquareHd, FourK, Low, Two, 4), (SquareHd, FourK, Low, Three, 6), (SquareHd, FourK, Low, Four, 8),
      (SquareHd, FourK, Medium, One, 10), (SquareHd, FourK, Medium, Two, 20), (SquareHd, FourK, Medium, Three, 30), (SquareHd, FourK, Medium, Four, 40),
      (SquareHd, FourK, High, One, 41), (SquareHd, FourK, High, Two, 82), (SquareHd, FourK, High, Three, 123), (SquareHd, FourK, High, Four, 164),
      // Landscape4x3
      (Landscape4x3, OneK, Low, One, 1), (Landscape4x3, OneK, Low, Two, 2), (Landscape4x3, OneK, Low, Three, 3), (Landscape4x3, OneK, Low, Four, 4),
      (Landscape4x3, OneK, Medium, One, 4), (Landscape4x3, OneK, Medium, Two, 8), (Landscape4x3, OneK, Medium, Three, 12), (Landscape4x3, OneK, Medium, Four, 16),
      (Landscape4x3, OneK, High, One, 14), (Landscape4x3, OneK, High, Two, 28), (Landscape4x3, OneK, High, Three, 42), (Landscape4x3, OneK, High, Four, 56),
      (Landscape4x3, TwoK, Low, One, 1), (Landscape4x3, TwoK, Low, Two, 2), (Landscape4x3, TwoK, Low, Three, 3), (Landscape4x3, TwoK, Low, Four, 4),
      (Landscape4x3, TwoK, Medium, One, 6), (Landscape4x3, TwoK, Medium, Two, 12), (Landscape4x3, TwoK, Medium, Three, 18), (Landscape4x3, TwoK, Medium, Four, 24),
      (Landscape4x3, TwoK, High, One, 23), (Landscape4x3, TwoK, High, Two, 46), (Landscape4x3, TwoK, High, Three, 69), (Landscape4x3, TwoK, High, Four, 92),
      (Landscape4x3, ThreeK, Low, One, 2), (Landscape4x3, ThreeK, Low, Two, 4), (Landscape4x3, ThreeK, Low, Three, 6), (Landscape4x3, ThreeK, Low, Four, 8),
      (Landscape4x3, ThreeK, Medium, One, 9), (Landscape4x3, ThreeK, Medium, Two, 18), (Landscape4x3, ThreeK, Medium, Three, 27), (Landscape4x3, ThreeK, Medium, Four, 36),
      (Landscape4x3, ThreeK, High, One, 36), (Landscape4x3, ThreeK, High, Two, 72), (Landscape4x3, ThreeK, High, Three, 108), (Landscape4x3, ThreeK, High, Four, 144),
      (Landscape4x3, FourK, Low, One, 2), (Landscape4x3, FourK, Low, Two, 4), (Landscape4x3, FourK, Low, Three, 6), (Landscape4x3, FourK, Low, Four, 8),
      (Landscape4x3, FourK, Medium, One, 10), (Landscape4x3, FourK, Medium, Two, 20), (Landscape4x3, FourK, Medium, Three, 30), (Landscape4x3, FourK, Medium, Four, 40),
      (Landscape4x3, FourK, High, One, 40), (Landscape4x3, FourK, High, Two, 80), (Landscape4x3, FourK, High, Three, 120), (Landscape4x3, FourK, High, Four, 160),
      // Landscape16x9
      (Landscape16x9, OneK, Low, One, 1), (Landscape16x9, OneK, Low, Two, 2), (Landscape16x9, OneK, Low, Three, 3), (Landscape16x9, OneK, Low, Four, 4),
      (Landscape16x9, OneK, Medium, One, 4), (Landscape16x9, OneK, Medium, Two, 8), (Landscape16x9, OneK, Medium, Three, 12), (Landscape16x9, OneK, Medium, Four, 16),
      (Landscape16x9, OneK, High, One, 14), (Landscape16x9, OneK, High, Two, 28), (Landscape16x9, OneK, High, Three, 42), (Landscape16x9, OneK, High, Four, 56),
      (Landscape16x9, TwoK, Low, One, 1), (Landscape16x9, TwoK, Low, Two, 2), (Landscape16x9, TwoK, Low, Three, 3), (Landscape16x9, TwoK, Low, Four, 4),
      (Landscape16x9, TwoK, Medium, One, 5), (Landscape16x9, TwoK, Medium, Two, 10), (Landscape16x9, TwoK, Medium, Three, 15), (Landscape16x9, TwoK, Medium, Four, 20),
      (Landscape16x9, TwoK, High, One, 20), (Landscape16x9, TwoK, High, Two, 40), (Landscape16x9, TwoK, High, Three, 60), (Landscape16x9, TwoK, High, Four, 80),
      (Landscape16x9, ThreeK, Low, One, 1), (Landscape16x9, ThreeK, Low, Two, 2), (Landscape16x9, ThreeK, Low, Three, 3), (Landscape16x9, ThreeK, Low, Four, 4),
      (Landscape16x9, ThreeK, Medium, One, 8), (Landscape16x9, ThreeK, Medium, Two, 16), (Landscape16x9, ThreeK, Medium, Three, 24), (Landscape16x9, ThreeK, Medium, Four, 32),
      (Landscape16x9, ThreeK, High, One, 30), (Landscape16x9, ThreeK, High, Two, 60), (Landscape16x9, ThreeK, High, Three, 90), (Landscape16x9, ThreeK, High, Four, 120),
      (Landscape16x9, FourK, Low, One, 2), (Landscape16x9, FourK, Low, Two, 4), (Landscape16x9, FourK, Low, Three, 6), (Landscape16x9, FourK, Low, Four, 8),
      (Landscape16x9, FourK, Medium, One, 10), (Landscape16x9, FourK, Medium, Two, 20), (Landscape16x9, FourK, Medium, Three, 30), (Landscape16x9, FourK, Medium, Four, 40),
      (Landscape16x9, FourK, High, One, 41), (Landscape16x9, FourK, High, Two, 82), (Landscape16x9, FourK, High, Three, 123), (Landscape16x9, FourK, High, Four, 164),
      // Portrait4x3
      (Portrait4x3, OneK, Low, One, 1), (Portrait4x3, OneK, Low, Two, 2), (Portrait4x3, OneK, Low, Three, 3), (Portrait4x3, OneK, Low, Four, 4),
      (Portrait4x3, OneK, Medium, One, 4), (Portrait4x3, OneK, Medium, Two, 8), (Portrait4x3, OneK, Medium, Three, 12), (Portrait4x3, OneK, Medium, Four, 16),
      (Portrait4x3, OneK, High, One, 14), (Portrait4x3, OneK, High, Two, 28), (Portrait4x3, OneK, High, Three, 42), (Portrait4x3, OneK, High, Four, 56),
      (Portrait4x3, TwoK, Low, One, 1), (Portrait4x3, TwoK, Low, Two, 2), (Portrait4x3, TwoK, Low, Three, 3), (Portrait4x3, TwoK, Low, Four, 4),
      (Portrait4x3, TwoK, Medium, One, 6), (Portrait4x3, TwoK, Medium, Two, 12), (Portrait4x3, TwoK, Medium, Three, 18), (Portrait4x3, TwoK, Medium, Four, 24),
      (Portrait4x3, TwoK, High, One, 23), (Portrait4x3, TwoK, High, Two, 46), (Portrait4x3, TwoK, High, Three, 69), (Portrait4x3, TwoK, High, Four, 92),
      (Portrait4x3, ThreeK, Low, One, 2), (Portrait4x3, ThreeK, Low, Two, 4), (Portrait4x3, ThreeK, Low, Three, 6), (Portrait4x3, ThreeK, Low, Four, 8),
      (Portrait4x3, ThreeK, Medium, One, 9), (Portrait4x3, ThreeK, Medium, Two, 18), (Portrait4x3, ThreeK, Medium, Three, 27), (Portrait4x3, ThreeK, Medium, Four, 36),
      (Portrait4x3, ThreeK, High, One, 36), (Portrait4x3, ThreeK, High, Two, 72), (Portrait4x3, ThreeK, High, Three, 108), (Portrait4x3, ThreeK, High, Four, 144),
      (Portrait4x3, FourK, Low, One, 2), (Portrait4x3, FourK, Low, Two, 4), (Portrait4x3, FourK, Low, Three, 6), (Portrait4x3, FourK, Low, Four, 8),
      (Portrait4x3, FourK, Medium, One, 10), (Portrait4x3, FourK, Medium, Two, 20), (Portrait4x3, FourK, Medium, Three, 30), (Portrait4x3, FourK, Medium, Four, 40),
      (Portrait4x3, FourK, High, One, 40), (Portrait4x3, FourK, High, Two, 80), (Portrait4x3, FourK, High, Three, 120), (Portrait4x3, FourK, High, Four, 160),
      // Portrait16x9
      (Portrait16x9, OneK, Low, One, 1), (Portrait16x9, OneK, Low, Two, 2), (Portrait16x9, OneK, Low, Three, 3), (Portrait16x9, OneK, Low, Four, 4),
      (Portrait16x9, OneK, Medium, One, 4), (Portrait16x9, OneK, Medium, Two, 8), (Portrait16x9, OneK, Medium, Three, 12), (Portrait16x9, OneK, Medium, Four, 16),
      (Portrait16x9, OneK, High, One, 14), (Portrait16x9, OneK, High, Two, 28), (Portrait16x9, OneK, High, Three, 42), (Portrait16x9, OneK, High, Four, 56),
      (Portrait16x9, TwoK, Low, One, 1), (Portrait16x9, TwoK, Low, Two, 2), (Portrait16x9, TwoK, Low, Three, 3), (Portrait16x9, TwoK, Low, Four, 4),
      (Portrait16x9, TwoK, Medium, One, 5), (Portrait16x9, TwoK, Medium, Two, 10), (Portrait16x9, TwoK, Medium, Three, 15), (Portrait16x9, TwoK, Medium, Four, 20),
      (Portrait16x9, TwoK, High, One, 20), (Portrait16x9, TwoK, High, Two, 40), (Portrait16x9, TwoK, High, Three, 60), (Portrait16x9, TwoK, High, Four, 80),
      (Portrait16x9, ThreeK, Low, One, 1), (Portrait16x9, ThreeK, Low, Two, 2), (Portrait16x9, ThreeK, Low, Three, 3), (Portrait16x9, ThreeK, Low, Four, 4),
      (Portrait16x9, ThreeK, Medium, One, 8), (Portrait16x9, ThreeK, Medium, Two, 16), (Portrait16x9, ThreeK, Medium, Three, 24), (Portrait16x9, ThreeK, Medium, Four, 32),
      (Portrait16x9, ThreeK, High, One, 30), (Portrait16x9, ThreeK, High, Two, 60), (Portrait16x9, ThreeK, High, Three, 90), (Portrait16x9, ThreeK, High, Four, 120),
      (Portrait16x9, FourK, Low, One, 2), (Portrait16x9, FourK, Low, Two, 4), (Portrait16x9, FourK, Low, Three, 6), (Portrait16x9, FourK, Low, Four, 8),
      (Portrait16x9, FourK, Medium, One, 10), (Portrait16x9, FourK, Medium, Two, 20), (Portrait16x9, FourK, Medium, Three, 30), (Portrait16x9, FourK, Medium, Four, 40),
      (Portrait16x9, FourK, High, One, 41), (Portrait16x9, FourK, High, Two, 82), (Portrait16x9, FourK, High, Three, 123), (Portrait16x9, FourK, High, Four, 164),
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
      for &size in &[Square, Landscape16x9, Portrait4x3, Auto] {
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
