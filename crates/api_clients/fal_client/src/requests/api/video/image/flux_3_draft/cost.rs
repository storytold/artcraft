use crate::requests::api::video::image::flux_3_draft::api::Flux3DraftImageToVideoRequest;
use crate::requests::api::video::text::flux_3::cost::{
  flux_3_estimated_duration_secs, flux_3_video_cost_cents,
};
use crate::requests::api::video::text::flux_3_draft::cost::flux_3_draft_generation_rate_cents_per_sec;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Draft image-to-video shares the Flux 3 Draft generation pricing (see the
// draft text module for the canonical rate):
//   $0.06 per second of generated draft video (always 720p)

impl FalRequestCostCalculator for Flux3DraftImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    let duration_secs = flux_3_estimated_duration_secs(self.duration);
    flux_3_video_cost_cents(flux_3_draft_generation_rate_cents_per_sec(), duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::flux_3::api::Flux3Duration;

  fn make_request(duration: Option<Flux3Duration>) -> Flux3DraftImageToVideoRequest {
    Flux3DraftImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/frame.png".to_string(),
      duration,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, expected_cents) — 6¢ × secs; None/auto estimate at 5s.
    const COST_TABLE: &[(Option<Flux3Duration>, u64)] = &[
      (Some(Flux3Duration::Seconds(5)),  30),
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
  }
}
