use crate::requests::api::video::text::minimax_h3::api::{
  MinimaxH3Resolution, MinimaxH3TextToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// MiniMax H3 (Hailuo-03) pricing (see https://fal.ai/models/minimax/h3/text-to-video):
//   768P: $0.16 per video second
//   2K:   $0.26 per video second
//
// Pricing depends on resolution and duration only (aspect ratio is free).
// Both rates are exact whole cents. Shared by the text + image + reference
// modalities (reference additionally bills extra reference images; see the
// reference cost module).
const RATE_768P_CENTS_PER_SEC: u64 = 16; // $0.16/sec
const RATE_2K_CENTS_PER_SEC: u64 = 26; // $0.26/sec

/// Per-second rate in whole cents for MiniMax H3. `is_2k` selects the 2K tier.
pub(crate) fn minimax_h3_rate_cents_per_sec(is_2k: bool) -> u64 {
  if is_2k { RATE_2K_CENTS_PER_SEC } else { RATE_768P_CENTS_PER_SEC }
}

/// Per-second rate × duration → whole cents (both rates are exact cents, so no
/// rounding is needed).
pub(crate) fn minimax_h3_video_cost_cents(rate_cents_per_sec: u64, duration_secs: u64) -> UsdCents {
  rate_cents_per_sec * duration_secs
}

impl FalRequestCostCalculator for MinimaxH3TextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 5s, resolution = 2K.
    let duration_secs = u64::from(self.duration.unwrap_or(5));
    let is_2k = self.resolution
      .unwrap_or(MinimaxH3Resolution::TwoK)
      .is_2k();

    let rate = minimax_h3_rate_cents_per_sec(is_2k);
    minimax_h3_video_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::minimax_h3::api::MinimaxH3TextToVideoAspectRatio;

  fn make_request(
    duration: Option<u8>,
    resolution: Option<MinimaxH3Resolution>,
  ) -> MinimaxH3TextToVideoRequest {
    MinimaxH3TextToVideoRequest {
      prompt: "test".to_string(),
      duration,
      resolution,
      aspect_ratio: Some(MinimaxH3TextToVideoAspectRatio::SixteenByNine),
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, expected_cents)
    // Math: rate × secs where rate (cents) = 16 (768P) or 26 (2K).
    const COST_TABLE: &[(Option<u8>, Option<MinimaxH3Resolution>, u64)] = &[
      // 768P → $0.16/s
      (Some(5),  Some(MinimaxH3Resolution::SevenSixtyEightP), 80),
      (Some(10), Some(MinimaxH3Resolution::SevenSixtyEightP), 160),
      (Some(15), Some(MinimaxH3Resolution::SevenSixtyEightP), 240),
      // 2K → $0.26/s
      (Some(5),  Some(MinimaxH3Resolution::TwoK), 130),
      (Some(10), Some(MinimaxH3Resolution::TwoK), 260),
      (Some(15), Some(MinimaxH3Resolution::TwoK), 390),
      // Defaults: duration=None→5s, resolution=None→2K
      (None, None, 130),
      (Some(8), None, 208),
      (None, Some(MinimaxH3Resolution::SevenSixtyEightP), 80),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, expected) in COST_TABLE {
        let got = make_request(duration, resolution).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }

    #[test]
    fn two_k_is_more_expensive_than_768p() {
      let low = make_request(Some(8), Some(MinimaxH3Resolution::SevenSixtyEightP)).calculate_cost_in_cents();
      let high = make_request(Some(8), Some(MinimaxH3Resolution::TwoK)).calculate_cost_in_cents();
      assert!(high > low, "2K={high}¢ should exceed 768P={low}¢");
    }

    #[test]
    fn cost_scales_linearly_with_duration() {
      let five = make_request(Some(5), Some(MinimaxH3Resolution::SevenSixtyEightP)).calculate_cost_in_cents();
      let ten = make_request(Some(10), Some(MinimaxH3Resolution::SevenSixtyEightP)).calculate_cost_in_cents();
      assert_eq!(ten, five * 2);
    }

    /// Aspect ratio does not affect the bill (only resolution + duration do).
    #[test]
    fn cost_ignores_aspect_ratio() {
      let baseline = make_request(Some(8), Some(MinimaxH3Resolution::TwoK)).calculate_cost_in_cents();
      for ar in [
        None,
        Some(MinimaxH3TextToVideoAspectRatio::TwentyOneByNine),
        Some(MinimaxH3TextToVideoAspectRatio::Square),
        Some(MinimaxH3TextToVideoAspectRatio::NineBySixteen),
      ] {
        let cost = MinimaxH3TextToVideoRequest {
          aspect_ratio: ar,
          ..make_request(Some(8), Some(MinimaxH3Resolution::TwoK))
        }.calculate_cost_in_cents();
        assert_eq!(cost, baseline, "ar={ar:?}");
      }
    }
  }
}
