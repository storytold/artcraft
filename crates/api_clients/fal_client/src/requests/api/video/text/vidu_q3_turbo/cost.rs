use crate::requests::api::video::text::vidu_q3_turbo::api::{
  ViduQ3TurboTextToVideoRequest, ViduQ3TurboTextToVideoResolution,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Vidu Q3 Turbo pricing (see https://fal.ai/models/fal-ai/vidu/q3/text-to-video/turbo):
//   "0.035 $ per video second for 360p and 540p, cost will be 2.2x for 720p
//    and 1080p resolution."
//     360p / 540p:  $0.035/sec
//     720p / 1080p: $0.077/sec  (2.2 × $0.035)
//
// Half the Vidu Q3 rate. Pricing depends on resolution and duration only.
// Rates are stored in tenths-of-a-cent per second (both exact), then rounded
// UP to whole cents so the user is never undercharged. Shared by text + image.
const RATE_LOW_RES_TENTH_CENTS: u64 = 35; // $0.035/sec (360p/540p)
const RATE_HIGH_RES_TENTH_CENTS: u64 = 77; // $0.077/sec (720p/1080p)

/// Per-second rate in tenths-of-a-cent for Vidu Q3 Turbo. `is_high_res`
/// selects the 2.2× 720p/1080p tier.
pub(crate) fn vidu_q3_turbo_rate_tenth_cents_per_sec(is_high_res: bool) -> u64 {
  if is_high_res { RATE_HIGH_RES_TENTH_CENTS } else { RATE_LOW_RES_TENTH_CENTS }
}

/// ceil(rate_tenth_cents × seconds / 10) → whole cents.
pub(crate) fn vidu_q3_turbo_cost_cents(rate_tenth_cents_per_sec: u64, duration_secs: u64) -> UsdCents {
  (rate_tenth_cents_per_sec * duration_secs + 9) / 10
}

impl FalRequestCostCalculator for ViduQ3TurboTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 5s, resolution = 720p.
    let duration_secs = u64::from(self.duration.unwrap_or(5));
    let is_high_res = self.resolution
      .unwrap_or(ViduQ3TurboTextToVideoResolution::SevenTwentyP)
      .is_high_res();

    let rate = vidu_q3_turbo_rate_tenth_cents_per_sec(is_high_res);
    vidu_q3_turbo_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::vidu_q3_turbo::api::ViduQ3TurboTextToVideoAspectRatio;

  fn make_request(
    duration: Option<u8>,
    resolution: Option<ViduQ3TurboTextToVideoResolution>,
    audio: Option<bool>,
  ) -> ViduQ3TurboTextToVideoRequest {
    ViduQ3TurboTextToVideoRequest {
      prompt: "test".to_string(),
      duration,
      seed: None,
      aspect_ratio: Some(ViduQ3TurboTextToVideoAspectRatio::SixteenByNine),
      resolution,
      audio,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, expected_cents)
    // Math: ceil(rate × secs / 10) where rate (tenth-cents) = 35 (360p/540p)
    // or 77 (720p/1080p).
    const COST_TABLE: &[(Option<u8>, Option<ViduQ3TurboTextToVideoResolution>, u64)] = &[
      // 360p / 540p → $0.035/s (rounds up)
      (Some(5),  Some(ViduQ3TurboTextToVideoResolution::ThreeSixtyP), 18), // 17.5 → 18
      (Some(5),  Some(ViduQ3TurboTextToVideoResolution::FiveFortyP),  18),
      (Some(16), Some(ViduQ3TurboTextToVideoResolution::ThreeSixtyP), 56),
      (Some(1),  Some(ViduQ3TurboTextToVideoResolution::ThreeSixtyP), 4),  // 3.5 → 4
      // 720p / 1080p → $0.077/s (rounds up)
      (Some(5),  Some(ViduQ3TurboTextToVideoResolution::SevenTwentyP), 39), // 38.5 → 39
      (Some(5),  Some(ViduQ3TurboTextToVideoResolution::TenEightyP),   39),
      (Some(10), Some(ViduQ3TurboTextToVideoResolution::SevenTwentyP), 77),
      (Some(3),  Some(ViduQ3TurboTextToVideoResolution::SevenTwentyP), 24), // 23.1 → 24
      // Defaults: duration=None→5s, resolution=None→720p
      (None, None, 39),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, expected) in COST_TABLE {
        let got = make_request(duration, resolution, Some(true)).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }

    /// Turbo is roughly half the price of Q3 at the same settings (both round
    /// up to whole cents, so it is not exactly half at every cell).
    #[test]
    fn turbo_high_res_rate_is_half_of_q3() {
      use crate::requests::api::video::text::vidu_q3::cost::vidu_q3_rate_tenth_cents_per_sec;
      assert_eq!(
        vidu_q3_turbo_rate_tenth_cents_per_sec(true) * 2,
        vidu_q3_rate_tenth_cents_per_sec(true),
      );
      assert_eq!(
        vidu_q3_turbo_rate_tenth_cents_per_sec(false) * 2,
        vidu_q3_rate_tenth_cents_per_sec(false),
      );
    }

    #[test]
    fn high_res_is_more_expensive_than_low_res() {
      let low = make_request(Some(8), Some(ViduQ3TurboTextToVideoResolution::FiveFortyP), Some(true)).calculate_cost_in_cents();
      let high = make_request(Some(8), Some(ViduQ3TurboTextToVideoResolution::SevenTwentyP), Some(true)).calculate_cost_in_cents();
      assert!(high > low, "high={high}¢ should exceed low={low}¢");
    }

    /// Audio and aspect ratio do not affect the bill.
    #[test]
    fn cost_ignores_audio_and_aspect_ratio() {
      let baseline = make_request(Some(8), Some(ViduQ3TurboTextToVideoResolution::SevenTwentyP), Some(true)).calculate_cost_in_cents();
      for audio in [None, Some(false), Some(true)] {
        for ar in [
          ViduQ3TurboTextToVideoAspectRatio::SixteenByNine,
          ViduQ3TurboTextToVideoAspectRatio::Square,
        ] {
          let cost = ViduQ3TurboTextToVideoRequest {
            aspect_ratio: Some(ar),
            ..make_request(Some(8), Some(ViduQ3TurboTextToVideoResolution::SevenTwentyP), audio)
          }.calculate_cost_in_cents();
          assert_eq!(cost, baseline, "audio={audio:?} ar={ar:?}");
        }
      }
    }
  }
}
