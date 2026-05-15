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
