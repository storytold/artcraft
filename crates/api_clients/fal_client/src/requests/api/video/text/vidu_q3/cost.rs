use crate::requests::api::video::text::vidu_q3::api::{
  ViduQ3TextToVideoRequest, ViduQ3TextToVideoResolution,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Vidu Q3 pricing (see https://fal.ai/models/fal-ai/vidu/q3/text-to-video):
//   "0.07 $ per video second for 360p and 540p, cost will be 2.2x for 720p and
//    1080p resolution."
//     360p / 540p:  $0.07/sec
//     720p / 1080p: $0.154/sec  (2.2 × $0.07)
//
// Pricing depends on resolution and duration only (audio/aspect ratio are
// free). Rates are stored in tenths-of-a-cent per second (both exact), then
// rounded UP to whole cents so the user is never undercharged. Shared by the
// text + image modalities.
const RATE_LOW_RES_TENTH_CENTS: u64 = 70; // $0.07/sec (360p/540p)
const RATE_HIGH_RES_TENTH_CENTS: u64 = 154; // $0.154/sec (720p/1080p)

/// Per-second rate in tenths-of-a-cent for Vidu Q3. `is_high_res` selects the
/// 2.2× 720p/1080p tier.
pub(crate) fn vidu_q3_rate_tenth_cents_per_sec(is_high_res: bool) -> u64 {
  if is_high_res { RATE_HIGH_RES_TENTH_CENTS } else { RATE_LOW_RES_TENTH_CENTS }
}

/// ceil(rate_tenth_cents × seconds / 10) → whole cents.
pub(crate) fn vidu_q3_cost_cents(rate_tenth_cents_per_sec: u64, duration_secs: u64) -> UsdCents {
  (rate_tenth_cents_per_sec * duration_secs + 9) / 10
}

impl FalRequestCostCalculator for ViduQ3TextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 5s, resolution = 720p.
    let duration_secs = u64::from(self.duration.unwrap_or(5));
    let is_high_res = self.resolution
      .unwrap_or(ViduQ3TextToVideoResolution::SevenTwentyP)
      .is_high_res();

    let rate = vidu_q3_rate_tenth_cents_per_sec(is_high_res);
    vidu_q3_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::vidu_q3::api::ViduQ3TextToVideoAspectRatio;

  fn make_request(
    duration: Option<u8>,
    resolution: Option<ViduQ3TextToVideoResolution>,
    audio: Option<bool>,
  ) -> ViduQ3TextToVideoRequest {
    ViduQ3TextToVideoRequest {
      prompt: "test".to_string(),
      duration,
      seed: None,
      aspect_ratio: Some(ViduQ3TextToVideoAspectRatio::SixteenByNine),
      resolution,
      audio,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, expected_cents)
    // Math: ceil(rate × secs / 10) where rate (tenth-cents) = 70 (360p/540p)
    // or 154 (720p/1080p).
    const COST_TABLE: &[(Option<u8>, Option<ViduQ3TextToVideoResolution>, u64)] = &[
      // 360p / 540p → $0.07/s
      (Some(5),  Some(ViduQ3TextToVideoResolution::ThreeSixtyP), 35),
      (Some(5),  Some(ViduQ3TextToVideoResolution::FiveFortyP),  35),
      (Some(16), Some(ViduQ3TextToVideoResolution::ThreeSixtyP), 112),
      // 720p / 1080p → $0.154/s
      (Some(5),  Some(ViduQ3TextToVideoResolution::SevenTwentyP), 77),
      (Some(5),  Some(ViduQ3TextToVideoResolution::TenEightyP),   77),
      (Some(10), Some(ViduQ3TextToVideoResolution::SevenTwentyP), 154),
      (Some(3),  Some(ViduQ3TextToVideoResolution::SevenTwentyP), 47), // 46.2 → 47
      // Defaults: duration=None→5s, resolution=None→720p
      (None, None, 77),
      (Some(1), Some(ViduQ3TextToVideoResolution::ThreeSixtyP), 7),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, expected) in COST_TABLE {
        let got = make_request(duration, resolution, Some(true)).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }

    #[test]
    fn high_res_is_more_expensive_than_low_res() {
      let low = make_request(Some(8), Some(ViduQ3TextToVideoResolution::FiveFortyP), Some(true)).calculate_cost_in_cents();
      let high = make_request(Some(8), Some(ViduQ3TextToVideoResolution::SevenTwentyP), Some(true)).calculate_cost_in_cents();
      assert!(high > low, "high={high}¢ should exceed low={low}¢");
    }

    #[test]
    fn cost_scales_linearly_with_duration() {
      let five = make_request(Some(5), Some(ViduQ3TextToVideoResolution::ThreeSixtyP), Some(true)).calculate_cost_in_cents();
      let ten = make_request(Some(10), Some(ViduQ3TextToVideoResolution::ThreeSixtyP), Some(true)).calculate_cost_in_cents();
      assert_eq!(ten, five * 2);
    }

    /// Audio and aspect ratio do not affect the bill (only resolution + duration do).
    #[test]
    fn cost_ignores_audio_and_aspect_ratio() {
      let baseline = make_request(Some(8), Some(ViduQ3TextToVideoResolution::SevenTwentyP), Some(true)).calculate_cost_in_cents();
      for audio in [None, Some(false), Some(true)] {
        for ar in [
          ViduQ3TextToVideoAspectRatio::SixteenByNine,
          ViduQ3TextToVideoAspectRatio::Square,
          ViduQ3TextToVideoAspectRatio::ThreeByFour,
        ] {
          let cost = ViduQ3TextToVideoRequest {
            aspect_ratio: Some(ar),
            ..make_request(Some(8), Some(ViduQ3TextToVideoResolution::SevenTwentyP), audio)
          }.calculate_cost_in_cents();
          assert_eq!(cost, baseline, "audio={audio:?} ar={ar:?}");
        }
      }
    }
  }
}
