use crate::requests::api::video::image::veo_2::api::{Veo2ImageToVideoDuration, Veo2ImageToVideoRequest};
use crate::requests::api::video::text::veo_2::cost::veo_2_cost_cents;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Image-to-video shares the Veo 2 pricing (see the text module for the
// canonical formula): $2.50 base for 5s, +$0.50 per additional second.

impl FalRequestCostCalculator for Veo2ImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal default when unset: duration = 5s.
    let duration_secs = self.duration
      .unwrap_or(Veo2ImageToVideoDuration::FiveSeconds)
      .to_seconds();
    veo_2_cost_cents(duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(duration: Option<Veo2ImageToVideoDuration>) -> Veo2ImageToVideoRequest {
    Veo2ImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/x.png".to_string(),
      duration,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, expected_cents): 250 base + 50 per second over 5s.
    const COST_TABLE: &[(Option<Veo2ImageToVideoDuration>, u64)] = &[
      (Some(Veo2ImageToVideoDuration::FiveSeconds),  250),
      (Some(Veo2ImageToVideoDuration::SixSeconds),   300),
      (Some(Veo2ImageToVideoDuration::SevenSeconds), 350),
      (Some(Veo2ImageToVideoDuration::EightSeconds), 400),
      // Default: duration=None → 5s
      (None, 250),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, expected) in COST_TABLE {
        assert_eq!(
          make_request(duration).calculate_cost_in_cents(),
          expected,
          "duration={duration:?}",
        );
      }
    }

    /// Image-to-video must bill identically to text-to-video at every duration.
    #[test]
    fn matches_text_to_video_pricing() {
      for (secs, expected) in [(5, 250), (6, 300), (7, 350), (8, 400)] {
        assert_eq!(veo_2_cost_cents(secs), expected, "secs={secs}");
      }
    }
  }
}
