use crate::requests::api::video::extend::flux_3::api::Flux3ExtendVideoRequest;
use crate::requests::api::video::text::flux_3::cost::{
  flux_3_estimated_duration_secs, flux_3_is_1080p, flux_3_video_cost_cents,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Flux 3 extend-video pricing (see https://fal.ai/models/blackforestlabs/flux-3/extend-video):
//   720p:  $0.41 per second of generated video
//   1080p: $0.53 per second of generated video
//
// Extend bills higher than the other Flux 3 modalities (which are $0.17 and
// $0.29; see the text module). The source video is free; pricing depends on
// resolution and the generated extension's duration only.
const EXTEND_RATE_720P_CENTS_PER_SEC: u64 = 41; // $0.41/sec
const EXTEND_RATE_1080P_CENTS_PER_SEC: u64 = 53; // $0.53/sec

impl FalRequestCostCalculator for Flux3ExtendVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_secs = flux_3_estimated_duration_secs(self.duration);
    let rate = if flux_3_is_1080p(self.resolution) {
      EXTEND_RATE_1080P_CENTS_PER_SEC
    } else {
      EXTEND_RATE_720P_CENTS_PER_SEC
    };
    flux_3_video_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::flux_3::api::{Flux3Duration, Flux3Resolution};

  fn make_request(
    duration: Option<Flux3Duration>,
    resolution: Option<Flux3Resolution>,
  ) -> Flux3ExtendVideoRequest {
    Flux3ExtendVideoRequest {
      prompt: "test".to_string(),
      video_url: "https://example.com/source.mp4".to_string(),
      duration,
      resolution,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, expected_cents)
    // Math: rate × secs where rate (cents) = 41 (720p) or 53 (1080p);
    // None/auto durations are estimated at the 5s floor.
    const COST_TABLE: &[(Option<Flux3Duration>, Option<Flux3Resolution>, u64)] = &[
      (Some(Flux3Duration::Seconds(5)),  Some(Flux3Resolution::SevenTwentyP), 205),
      (Some(Flux3Duration::Seconds(20)), Some(Flux3Resolution::SevenTwentyP), 820),
      (Some(Flux3Duration::Seconds(5)),  Some(Flux3Resolution::TenEightyP), 265),
      (Some(Flux3Duration::Seconds(20)), Some(Flux3Resolution::TenEightyP), 1060),
      // Defaults: duration=None/auto→5s estimate, resolution=None→720p
      (None, None, 205),
      (Some(Flux3Duration::Auto), None, 205),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, expected) in COST_TABLE {
        let got = make_request(duration, resolution).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} resolution={resolution:?}");
      }
    }

    #[test]
    fn extend_is_more_expensive_than_standard_generation() {
      use crate::requests::api::video::text::flux_3::cost::flux_3_standard_rate_cents_per_sec;
      assert!(EXTEND_RATE_720P_CENTS_PER_SEC > flux_3_standard_rate_cents_per_sec(false));
      assert!(EXTEND_RATE_1080P_CENTS_PER_SEC > flux_3_standard_rate_cents_per_sec(true));
    }
  }
}
