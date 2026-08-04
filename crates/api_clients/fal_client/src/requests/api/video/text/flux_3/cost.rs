use crate::requests::api::video::text::flux_3::api::{
  Flux3Duration, Flux3Resolution, Flux3TextToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Flux 3 pricing (see https://fal.ai/models/blackforestlabs/flux-3/text-to-video):
//   720p:  $0.17 per second of generated video
//   1080p: $0.29 per second of generated video
//
// The same rates apply to the image-to-video, first-last-frame-to-video, and
// keyframes-to-video modalities (extend-video bills higher; see its cost
// module). Audio, aspect ratio, and safety tolerance are free. Both rates are
// exact whole cents.
const RATE_720P_CENTS_PER_SEC: u64 = 17; // $0.17/sec
const RATE_1080P_CENTS_PER_SEC: u64 = 29; // $0.29/sec

/// Duration assumed by cost estimates when the request leaves duration unset
/// or `auto` — fal bills the actual generated seconds, and 5s (the shortest
/// selectable duration) is the quotable floor.
const ASSUMED_AUTO_DURATION_SECS: u64 = 5;

/// Per-second rate in whole cents for the standard (non-extend) Flux 3
/// modalities. `is_1080p` selects the 1080p tier.
pub(crate) fn flux_3_standard_rate_cents_per_sec(is_1080p: bool) -> u64 {
  if is_1080p { RATE_1080P_CENTS_PER_SEC } else { RATE_720P_CENTS_PER_SEC }
}

/// Per-second rate × duration → whole cents (all Flux 3 rates are exact
/// cents, so no rounding is needed).
pub(crate) fn flux_3_video_cost_cents(rate_cents_per_sec: u64, duration_secs: u64) -> UsdCents {
  rate_cents_per_sec * duration_secs
}

/// Billable seconds for a flexible (`auto`-capable) duration. `None` and
/// `Auto` estimate at the 5-second floor.
pub(crate) fn flux_3_estimated_duration_secs(duration: Option<Flux3Duration>) -> u64 {
  match duration {
    None | Some(Flux3Duration::Auto) => ASSUMED_AUTO_DURATION_SECS,
    Some(Flux3Duration::Seconds(seconds)) => u64::from(seconds),
  }
}

/// Whether an optional resolution lands on the 1080p tier (fal defaults to
/// 720p when unset).
pub(crate) fn flux_3_is_1080p(resolution: Option<Flux3Resolution>) -> bool {
  resolution.map_or(false, |r| r.is_1080p())
}

impl FalRequestCostCalculator for Flux3TextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_secs = flux_3_estimated_duration_secs(self.duration);
    let rate = flux_3_standard_rate_cents_per_sec(flux_3_is_1080p(self.resolution));
    flux_3_video_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::flux_3::api::Flux3AspectRatio;

  fn make_request(
    duration: Option<Flux3Duration>,
    resolution: Option<Flux3Resolution>,
  ) -> Flux3TextToVideoRequest {
    Flux3TextToVideoRequest {
      prompt: "test".to_string(),
      duration,
      resolution,
      aspect_ratio: Some(Flux3AspectRatio::SixteenByNine),
      generate_audio: Some(true),
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, expected_cents)
    // Math: rate × secs where rate (cents) = 17 (720p) or 29 (1080p);
    // None/auto durations are estimated at the 5s floor.
    const COST_TABLE: &[(Option<Flux3Duration>, Option<Flux3Resolution>, u64)] = &[
      // 720p → $0.17/s
      (Some(Flux3Duration::Seconds(5)),  Some(Flux3Resolution::SevenTwentyP), 85),
      (Some(Flux3Duration::Seconds(10)), Some(Flux3Resolution::SevenTwentyP), 170),
      (Some(Flux3Duration::Seconds(20)), Some(Flux3Resolution::SevenTwentyP), 340),
      // 1080p → $0.29/s
      (Some(Flux3Duration::Seconds(5)),  Some(Flux3Resolution::TenEightyP), 145),
      (Some(Flux3Duration::Seconds(20)), Some(Flux3Resolution::TenEightyP), 580),
      // Defaults: duration=None/auto→5s estimate, resolution=None→720p
      (None, None, 85),
      (Some(Flux3Duration::Auto), None, 85),
      (Some(Flux3Duration::Auto), Some(Flux3Resolution::TenEightyP), 145),
      (None, Some(Flux3Resolution::TenEightyP), 145),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, expected) in COST_TABLE {
        let got = make_request(duration, resolution).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }

    #[test]
    fn ten_eighty_p_is_more_expensive_than_720p() {
      let low = make_request(Some(Flux3Duration::Seconds(8)), Some(Flux3Resolution::SevenTwentyP)).calculate_cost_in_cents();
      let high = make_request(Some(Flux3Duration::Seconds(8)), Some(Flux3Resolution::TenEightyP)).calculate_cost_in_cents();
      assert!(high > low, "1080p={high}¢ should exceed 720p={low}¢");
    }

    #[test]
    fn cost_scales_linearly_with_duration() {
      let five = make_request(Some(Flux3Duration::Seconds(5)), None).calculate_cost_in_cents();
      let ten = make_request(Some(Flux3Duration::Seconds(10)), None).calculate_cost_in_cents();
      assert_eq!(ten, five * 2);
    }

    /// Audio, aspect ratio, and safety tolerance do not affect the bill.
    #[test]
    fn cost_ignores_audio_aspect_ratio_and_safety_tolerance() {
      let baseline = make_request(Some(Flux3Duration::Seconds(8)), None).calculate_cost_in_cents();
      for generate_audio in [None, Some(false), Some(true)] {
        for safety_tolerance in [None, Some(0), Some(4)] {
          let cost = Flux3TextToVideoRequest {
            aspect_ratio: Some(Flux3AspectRatio::NineBySixteen),
            generate_audio,
            safety_tolerance,
            ..make_request(Some(Flux3Duration::Seconds(8)), None)
          }.calculate_cost_in_cents();
          assert_eq!(cost, baseline, "audio={generate_audio:?} safety={safety_tolerance:?}");
        }
      }
    }
  }
}
