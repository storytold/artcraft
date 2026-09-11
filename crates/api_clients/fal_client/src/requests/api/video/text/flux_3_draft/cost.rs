use crate::requests::api::video::text::flux_3::cost::{
  flux_3_estimated_duration_secs, flux_3_video_cost_cents,
};
use crate::requests::api::video::text::flux_3_draft::api::Flux3DraftTextToVideoRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Flux 3 Draft pricing (see https://fal.ai/models/blackforestlabs/flux-3/text-to-video/draft):
//   $0.06 per second of generated draft video (always 720p)
//
// The same rate applies to the draft image-to-video, first-last-frame, and
// keyframes modalities (draft extend-video bills higher; see its cost
// module). Audio, aspect ratio, and safety tolerance are free.
const DRAFT_RATE_CENTS_PER_SEC: u64 = 6; // $0.06/sec

/// Per-second rate in whole cents for the standard (non-extend) Flux 3 Draft
/// generation modalities.
pub(crate) fn flux_3_draft_generation_rate_cents_per_sec() -> u64 {
  DRAFT_RATE_CENTS_PER_SEC
}

impl FalRequestCostCalculator for Flux3DraftTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_secs = flux_3_estimated_duration_secs(self.duration);
    flux_3_video_cost_cents(flux_3_draft_generation_rate_cents_per_sec(), duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::flux_3::api::Flux3Duration;

  fn make_request(duration: Option<Flux3Duration>) -> Flux3DraftTextToVideoRequest {
    Flux3DraftTextToVideoRequest {
      prompt: "test".to_string(),
      duration,
      aspect_ratio: None,
      generate_audio: Some(true),
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, expected_cents)
    // Math: 6¢ × secs; None/auto durations are estimated at the 5s floor.
    const COST_TABLE: &[(Option<Flux3Duration>, u64)] = &[
      (Some(Flux3Duration::Seconds(5)),  30),
      (Some(Flux3Duration::Seconds(10)), 60),
      (Some(Flux3Duration::Seconds(20)), 120),
      (None, 30),
      (Some(Flux3Duration::Auto), 30),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, expected) in COST_TABLE {
        let got = make_request(duration).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?}");
      }
    }

    #[test]
    fn draft_is_cheaper_than_full_quality() {
      use crate::requests::api::video::text::flux_3::cost::flux_3_standard_rate_cents_per_sec;
      assert!(flux_3_draft_generation_rate_cents_per_sec() < flux_3_standard_rate_cents_per_sec(false));
    }
  }
}
