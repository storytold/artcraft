//! Cost model for GPT Image 2.5 (Flare and Sunburst share it).
//!
//! Fal bills by token: output image tokens at $30.00 / 1M, input image tokens at $8.00 / 1M,
//! text tokens at $5.00 / 1M input, rounded up to $0.0001. Rather than count tokens, we fit
//! the canonical per-image price table Fal publishes:
//!
//! | Size      | low      | medium   | high     | xhigh    | max      |
//! |-----------|----------|----------|----------|----------|----------|
//! | 1024x768  | $0.00402 | $0.00903 | $0.03612 | $0.06420 | $0.14445 |
//! | 1024x1024 | $0.00588 | $0.01317 | $0.05268 | $0.09366 | $0.21072 |
//! | 1024x1536 | $0.00474 | $0.01029 | $0.04116 | $0.07377 | $0.16464 |
//! | 1920x1080 | $0.00441 | $0.01029 | $0.03960 | $0.07041 | $0.15840 |
//! | 2560x1440 | $0.00615 | $0.01434 | $0.05529 | $0.09828 | $0.22110 |
//! | 3840x2160 | $0.01113 | $0.02595 | $0.10008 | $0.17790 | $0.40026 |
//!
//! Dividing by the output token price shows the structure: at `low` quality an image costs a
//! per-aspect-ratio base (~158 tokens for 1:1, ~106 for 4:3, ~101 for 3:2, ~72 for 16:9) plus
//! 36 tokens per megapixel, and each higher quality tier multiplies the token count by a
//! constant (medium 7/3, high 9, xhigh 16, max 36). The three 16:9 rows pin the slope and the
//! multipliers exactly; the other rows pin their bases.
//!
//! The estimate never undershoots the published table and is within 8% above it at every
//! canonical size (see tests). Prompt text tokens are not modelled: a few hundred tokens at
//! $5 / 1M is well under $0.002.

use crate::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_quality::GptImage2p5Quality;
use crate::requests::traits::fal_request_cost_calculator_trait::UsdCents;

/// Cost in hundredths of a US cent ($0.0001), the granularity Fal rounds GPT Image 2.5 to.
pub type UsdHundredthsOfCent = u64;

/// $30.00 per 1M output image tokens.
const OUTPUT_IMAGE_TOKEN_USD: f64 = 30.0 / 1_000_000.0;

/// $8.00 per 1M input image tokens.
const INPUT_IMAGE_TOKEN_USD: f64 = 8.0 / 1_000_000.0;

/// Output tokens per megapixel at `low` quality, fitted from the 16:9 rows of the table.
const LOW_QUALITY_OUTPUT_TOKENS_PER_MEGAPIXEL: f64 = 36.0;

/// Fal does not publish input image token counts. This is a conservative allowance per
/// reference image on edit requests, comparable to a high-detail 1024x1024 vision input.
const ESTIMATED_INPUT_TOKENS_PER_REFERENCE_IMAGE: f64 = 1_000.0;

/// Estimated cost of rendering one output image of the given size at the given quality.
pub fn estimate_output_image_cost(quality: GptImage2p5Quality, width: u32, height: u32) -> UsdHundredthsOfCent {
  let megapixels = width as f64 * height as f64 / 1_000_000.0;
  let low_quality_tokens = low_quality_base_tokens(width, height)
    + LOW_QUALITY_OUTPUT_TOKENS_PER_MEGAPIXEL * megapixels;
  let tokens = low_quality_tokens * quality_token_multiplier(quality);
  usd_to_hundredths_of_cent(tokens * OUTPUT_IMAGE_TOKEN_USD)
}

/// Estimated cost of the reference (input) images attached to an edit request.
pub fn estimate_reference_images_cost(num_reference_images: usize) -> UsdHundredthsOfCent {
  let tokens = num_reference_images as f64 * ESTIMATED_INPUT_TOKENS_PER_REFERENCE_IMAGE;
  usd_to_hundredths_of_cent(tokens * INPUT_IMAGE_TOKEN_USD)
}

/// Round up to whole cents.
pub fn hundredths_of_cent_to_cents(hundredths: UsdHundredthsOfCent) -> UsdCents {
  hundredths.div_ceil(100)
}

/// Token count multiplier for each quality tier relative to `low`.
fn quality_token_multiplier(quality: GptImage2p5Quality) -> f64 {
  match quality {
    GptImage2p5Quality::Low => 1.0,
    GptImage2p5Quality::Medium => 7.0 / 3.0,
    // `auto` lets the model choose; `high` is the documented default so we price it there.
    GptImage2p5Quality::High | GptImage2p5Quality::Auto => 9.0,
    GptImage2p5Quality::XHigh => 16.0,
    GptImage2p5Quality::Max => 36.0,
  }
}

/// Per-image base token count at `low` quality, which depends on the aspect ratio family.
/// Fitted from the canonical table: 1:1 => 158, 4:3 => 106, 3:2 => 101, 16:9 => 72.
fn low_quality_base_tokens(width: u32, height: u32) -> f64 {
  let long_edge = width.max(height) as f64;
  let short_edge = width.min(height).max(1) as f64;
  let ratio = long_edge / short_edge;
  if ratio < 1.25 {
    158.0 // ~1:1
  } else if ratio < 1.42 {
    106.0 // ~4:3 (1.333)
  } else if ratio < 1.60 {
    101.0 // ~3:2 (1.5)
  } else {
    72.0 // ~16:9 (1.778) and wider
  }
}

fn usd_to_hundredths_of_cent(usd: f64) -> UsdHundredthsOfCent {
  // Small epsilon so values that are exactly on a boundary in decimal don't round up
  // because of binary float noise.
  (usd * 10_000.0 - 1e-6).ceil().max(0.0) as u64
}

#[cfg(test)]
mod tests {
  use super::*;
  use GptImage2p5Quality::*;

  const ALL_QUALITIES: [GptImage2p5Quality; 5] = [Low, Medium, High, XHigh, Max];

  /// Fal's published canonical table, in hundredths of a cent: (width, height, [low, medium, high, xhigh, max]).
  const FAL_PUBLISHED_TABLE: &[(u32, u32, [u64; 5])] = &[
    (1024,  768, [ 40,  90,  361,  642, 1444]),
    (1024, 1024, [ 59, 132,  527,  937, 2107]),
    (1024, 1536, [ 47, 103,  412,  738, 1646]),
    (1920, 1080, [ 44, 103,  396,  704, 1584]),
    (2560, 1440, [ 62, 143,  553,  983, 2211]),
    (3840, 2160, [111, 260, 1001, 1779, 4003]),
  ];

  /// What our model produces at the canonical sizes, in hundredths of a cent. Pinned so a
  /// change to the fit is a deliberate, visible diff.
  const MODEL_TABLE: &[(u32, u32, [u64; 5])] = &[
    (1024,  768, [ 41,  95,  363,  645, 1451]),
    (1024, 1024, [ 59, 138,  529,  940, 2115]),
    (1024, 1536, [ 48, 111,  426,  757, 1703]),
    (1920, 1080, [ 44, 103,  396,  704, 1584]),
    (2560, 1440, [ 62, 144,  553,  983, 2211]),
    (3840, 2160, [112, 260, 1001, 1779, 4003]),
  ];

  mod canonical_table_tests {
    use super::*;

    #[test]
    fn model_matches_pinned_values() {
      for &(w, h, expected) in MODEL_TABLE {
        for (quality, expected) in ALL_QUALITIES.iter().zip(expected) {
          let actual = estimate_output_image_cost(*quality, w, h);
          assert_eq!(actual, expected, "{w}x{h} {quality:?}");
        }
      }
    }

    #[test]
    fn model_never_undershoots_fal_published_prices() {
      for &(w, h, published) in FAL_PUBLISHED_TABLE {
        for (quality, published) in ALL_QUALITIES.iter().zip(published) {
          let actual = estimate_output_image_cost(*quality, w, h);
          assert!(actual >= published, "{w}x{h} {quality:?}: model {actual} < published {published}");
        }
      }
    }

    #[test]
    fn model_is_within_eight_percent_of_fal_published_prices() {
      for &(w, h, published) in FAL_PUBLISHED_TABLE {
        for (quality, published) in ALL_QUALITIES.iter().zip(published) {
          let actual = estimate_output_image_cost(*quality, w, h);
          let ceiling = published * 108 / 100 + 1;
          assert!(actual <= ceiling, "{w}x{h} {quality:?}: model {actual} > {ceiling} (published {published})");
        }
      }
    }

    #[test]
    fn sixteen_by_nine_rows_are_exact() {
      // The 16:9 rows pin the slope and the quality multipliers, so they should reproduce
      // exactly (the 1080p low row is the only one with a fractional base).
      assert_eq!(estimate_output_image_cost(High, 1920, 1080), 396);
      assert_eq!(estimate_output_image_cost(High, 2560, 1440), 553);
      assert_eq!(estimate_output_image_cost(High, 3840, 2160), 1001);
      assert_eq!(estimate_output_image_cost(Max, 3840, 2160), 4003);
    }
  }

  mod quality_tests {
    use super::*;

    #[test]
    fn auto_is_priced_as_high() {
      for &(w, h, _) in FAL_PUBLISHED_TABLE {
        assert_eq!(
          estimate_output_image_cost(Auto, w, h),
          estimate_output_image_cost(High, w, h),
          "{w}x{h}",
        );
      }
    }

    #[test]
    fn higher_quality_costs_strictly_more() {
      for &(w, h, _) in FAL_PUBLISHED_TABLE {
        for pair in ALL_QUALITIES.windows(2) {
          let lower = estimate_output_image_cost(pair[0], w, h);
          let higher = estimate_output_image_cost(pair[1], w, h);
          assert!(lower < higher, "{w}x{h}: {:?} ({lower}) should be < {:?} ({higher})", pair[0], pair[1]);
        }
      }
    }
  }

  mod dimension_tests {
    use super::*;

    #[test]
    fn more_pixels_at_same_aspect_costs_more() {
      let sizes_16x9 = [(1088, 608), (1920, 1080), (2048, 1152), (2560, 1440), (3072, 1728), (3840, 2160)];
      for pair in sizes_16x9.windows(2) {
        let smaller = estimate_output_image_cost(High, pair[0].0, pair[0].1);
        let larger = estimate_output_image_cost(High, pair[1].0, pair[1].1);
        assert!(smaller < larger, "{:?} ({smaller}) should be < {:?} ({larger})", pair[0], pair[1]);
      }
    }

    #[test]
    fn orientation_does_not_change_cost() {
      assert_eq!(estimate_output_image_cost(High, 1024, 768), estimate_output_image_cost(High, 768, 1024));
      assert_eq!(estimate_output_image_cost(High, 1920, 1080), estimate_output_image_cost(High, 1080, 1920));
      assert_eq!(estimate_output_image_cost(High, 1024, 1536), estimate_output_image_cost(High, 1536, 1024));
    }

    #[test]
    fn aspect_family_bases() {
      assert_eq!(low_quality_base_tokens(1024, 1024), 158.0);
      assert_eq!(low_quality_base_tokens(2048, 2048), 158.0);
      assert_eq!(low_quality_base_tokens(1024, 768), 106.0);
      assert_eq!(low_quality_base_tokens(768, 1024), 106.0);
      assert_eq!(low_quality_base_tokens(1024, 1536), 101.0);
      assert_eq!(low_quality_base_tokens(1920, 1080), 72.0);
      assert_eq!(low_quality_base_tokens(1088, 608), 72.0);
      assert_eq!(low_quality_base_tokens(3000, 1000), 72.0);
    }

    #[test]
    fn two_k_square_high_quality() {
      // 158 + 36 * 4.194304 = 308.99 tokens * 9 * $0.00003 = $0.08343 => 835 hundredths
      assert_eq!(estimate_output_image_cost(High, 2048, 2048), 835);
    }
  }

  mod reference_image_tests {
    use super::*;

    #[test]
    fn reference_images_cost_eighty_hundredths_each() {
      // 1,000 tokens * $8 / 1M = $0.008 per image
      assert_eq!(estimate_reference_images_cost(0), 0);
      assert_eq!(estimate_reference_images_cost(1), 80);
      assert_eq!(estimate_reference_images_cost(3), 240);
      assert_eq!(estimate_reference_images_cost(16), 1280);
    }
  }

  mod rounding_tests {
    use super::*;

    #[test]
    fn cents_round_up() {
      assert_eq!(hundredths_of_cent_to_cents(0), 0);
      assert_eq!(hundredths_of_cent_to_cents(1), 1);
      assert_eq!(hundredths_of_cent_to_cents(99), 1);
      assert_eq!(hundredths_of_cent_to_cents(100), 1);
      assert_eq!(hundredths_of_cent_to_cents(101), 2);
      assert_eq!(hundredths_of_cent_to_cents(1001), 11);
    }

    #[test]
    fn usd_conversion_rounds_up_without_float_noise() {
      assert_eq!(usd_to_hundredths_of_cent(0.0), 0);
      assert_eq!(usd_to_hundredths_of_cent(0.0001), 1);
      assert_eq!(usd_to_hundredths_of_cent(0.00588), 59);
      assert_eq!(usd_to_hundredths_of_cent(0.005881), 59);
      assert_eq!(usd_to_hundredths_of_cent(0.00589), 59);
      assert_eq!(usd_to_hundredths_of_cent(0.005901), 60);
    }
  }
}

