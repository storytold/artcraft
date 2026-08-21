use crate::requests::api::video::image::minimax_h3::api::MinimaxH3ImageToVideoRequest;
use crate::requests::api::video::text::minimax_h3::api::MinimaxH3Resolution;
use crate::requests::api::video::text::minimax_h3::cost::{
  minimax_h3_rate_cents_per_sec, minimax_h3_video_cost_cents,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Image-to-video shares the MiniMax H3 per-second pricing (see the text module
// for the canonical rate table):
//   768P: $0.16/sec
//   2K:   $0.26/sec
// Pricing depends on resolution and duration only (start/end frames are free).

impl FalRequestCostCalculator for MinimaxH3ImageToVideoRequest {
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

  fn make_request(
    duration: Option<u8>,
    resolution: Option<MinimaxH3Resolution>,
  ) -> MinimaxH3ImageToVideoRequest {
    MinimaxH3ImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/first.png".to_string(),
      end_image_url: None,
      duration,
      resolution,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, expected_cents)
    const COST_TABLE: &[(Option<u8>, Option<MinimaxH3Resolution>, u64)] = &[
      // 768P → $0.16/s
      (Some(5),  Some(MinimaxH3Resolution::SevenSixtyEightP), 80),
      (Some(15), Some(MinimaxH3Resolution::SevenSixtyEightP), 240),
      // 2K → $0.26/s
      (Some(5),  Some(MinimaxH3Resolution::TwoK), 130),
      (Some(15), Some(MinimaxH3Resolution::TwoK), 390),
      // Defaults: duration=None→5s, resolution=None→2K
      (None, None, 130),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, expected) in COST_TABLE {
        let got = make_request(duration, resolution).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }

    /// The end frame does not affect the bill (only resolution + duration do).
    #[test]
    fn cost_ignores_end_image() {
      let without = make_request(Some(8), Some(MinimaxH3Resolution::TwoK)).calculate_cost_in_cents();
      let with = MinimaxH3ImageToVideoRequest {
        end_image_url: Some("https://example.com/last.png".to_string()),
        ..make_request(Some(8), Some(MinimaxH3Resolution::TwoK))
      }.calculate_cost_in_cents();
      assert_eq!(with, without);
    }
  }
}
