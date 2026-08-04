use crate::requests::api::video::extend::flux_3_draft::api::Flux3DraftExtendVideoRequest;
use crate::requests::api::video::text::flux_3::cost::{
  flux_3_estimated_duration_secs, flux_3_video_cost_cents,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Flux 3 Draft extend-video pricing (see
// https://fal.ai/models/blackforestlabs/flux-3/extend-video/draft):
//   $0.12 per second of generated draft video (always 720p)
//
// Draft extend bills higher than the other draft modalities ($0.06/sec; see
// the draft text module). The source video is free; pricing depends on the
// generated extension's duration only.
const DRAFT_EXTEND_RATE_CENTS_PER_SEC: u64 = 12; // $0.12/sec

impl FalRequestCostCalculator for Flux3DraftExtendVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_secs = flux_3_estimated_duration_secs(self.duration);
    flux_3_video_cost_cents(DRAFT_EXTEND_RATE_CENTS_PER_SEC, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::flux_3::api::Flux3Duration;

  fn make_request(duration: Option<Flux3Duration>) -> Flux3DraftExtendVideoRequest {
    Flux3DraftExtendVideoRequest {
      prompt: "test".to_string(),
      video_url: "https://example.com/source.mp4".to_string(),
      duration,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, expected_cents) — 12¢ × secs; None/auto estimate at 5s.
    const COST_TABLE: &[(Option<Flux3Duration>, u64)] = &[
      (Some(Flux3Duration::Seconds(5)),  60),
      (Some(Flux3Duration::Seconds(20)), 240),
      (None, 60),
      (Some(Flux3Duration::Auto), 60),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, expected) in COST_TABLE {
        let got = make_request(duration).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?}");
      }
    }

    #[test]
    fn draft_extend_is_double_the_draft_generation_rate() {
      use crate::requests::api::video::text::flux_3_draft::cost::flux_3_draft_generation_rate_cents_per_sec;
      assert_eq!(DRAFT_EXTEND_RATE_CENTS_PER_SEC, flux_3_draft_generation_rate_cents_per_sec() * 2);
    }
  }
}
