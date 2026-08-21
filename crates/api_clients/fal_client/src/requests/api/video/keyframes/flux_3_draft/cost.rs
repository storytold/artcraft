use crate::requests::api::video::keyframes::flux_3_draft::api::Flux3DraftKeyframesToVideoRequest;
use crate::requests::api::video::text::flux_3::cost::flux_3_video_cost_cents;
use crate::requests::api::video::text::flux_3_draft::cost::flux_3_draft_generation_rate_cents_per_sec;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Draft keyframes-to-video shares the Flux 3 Draft generation pricing (see
// the draft text module for the canonical rate):
//   $0.06 per second of generated draft video (always 720p)

impl FalRequestCostCalculator for Flux3DraftKeyframesToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal default when unset: duration = 5s.
    let duration_secs = u64::from(self.duration.unwrap_or(5));
    flux_3_video_cost_cents(flux_3_draft_generation_rate_cents_per_sec(), duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::keyframes::flux_3::raw_request::Flux3Keyframe;

  fn make_request(duration: Option<u8>) -> Flux3DraftKeyframesToVideoRequest {
    Flux3DraftKeyframesToVideoRequest {
      prompt: "test".to_string(),
      keyframes: vec![
        Flux3Keyframe { image_url: "https://example.com/a.png".to_string(), frame_index: 0 },
      ],
      duration,
      aspect_ratio: None,
      generate_audio: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, expected_cents) — 6¢ × secs; None defaults to 5s.
    const COST_TABLE: &[(Option<u8>, u64)] = &[
      (Some(5),  30),
      (Some(20), 120),
      (None, 30),
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
