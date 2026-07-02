use crate::requests::api::video::text::veo_2::api::{Veo2TextToVideoDuration, Veo2TextToVideoRequest};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Veo 2 pricing (see https://fal.ai/models/fal-ai/veo2):
//   "For 5s video your request will cost $2.50. For every additional second
//    you will be charged $0.50."
//
// This is a flat base + per-extra-second model (NOT the per-second-rate model
// the Veo 3 family uses), and it does not vary by audio, resolution, or aspect
// ratio. All amounts are exact whole cents. Shared by text + image modalities.
const BASE_COST_CENTS: UsdCents = 250; // 5s
const ADDITIONAL_SECOND_COST_CENTS: UsdCents = 50;
const BASE_DURATION_SECS: u64 = 5;

/// Veo 2 cost in whole cents for a given duration in seconds.
/// `250 + (secs - 5) × 50`; durations below 5s (not reachable via the typed
/// enum) clamp to the base.
pub(crate) fn veo_2_cost_cents(duration_secs: u64) -> UsdCents {
  let extra_secs = duration_secs.saturating_sub(BASE_DURATION_SECS);
  BASE_COST_CENTS + extra_secs * ADDITIONAL_SECOND_COST_CENTS
}

impl FalRequestCostCalculator for Veo2TextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal default when unset: duration = 5s.
    let duration_secs = self.duration
      .unwrap_or(Veo2TextToVideoDuration::FiveSeconds)
      .to_seconds();
    veo_2_cost_cents(duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::veo_2::api::Veo2TextToVideoAspectRatio;

  fn make_request(duration: Option<Veo2TextToVideoDuration>) -> Veo2TextToVideoRequest {
    Veo2TextToVideoRequest {
      prompt: "test".to_string(),
      aspect_ratio: Some(Veo2TextToVideoAspectRatio::SixteenByNine),
      duration,
      negative_prompt: None,
      enhance_prompt: None,
      seed: None,
      auto_fix: None,
    }
  }

  /// fal: "For 5s video your request will cost $2.50" → 250¢.
  #[test]
  fn matches_documented_5s_example() {
    assert_eq!(make_request(Some(Veo2TextToVideoDuration::FiveSeconds)).calculate_cost_in_cents(), 250);
  }

  /// fal i2v example: a 6-second video costs $3.00 ($2.50 + $0.50) → 300¢.
  #[test]
  fn matches_documented_6s_example() {
    assert_eq!(make_request(Some(Veo2TextToVideoDuration::SixSeconds)).calculate_cost_in_cents(), 300);
  }

  mod cost_table {
    use super::*;

    // (duration, expected_cents): 250 base + 50 per second over 5s.
    const COST_TABLE: &[(Option<Veo2TextToVideoDuration>, u64)] = &[
      (Some(Veo2TextToVideoDuration::FiveSeconds),  250),
      (Some(Veo2TextToVideoDuration::SixSeconds),   300),
      (Some(Veo2TextToVideoDuration::SevenSeconds), 350),
      (Some(Veo2TextToVideoDuration::EightSeconds), 400),
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

    #[test]
    fn each_extra_second_adds_fifty_cents() {
      let five = make_request(Some(Veo2TextToVideoDuration::FiveSeconds)).calculate_cost_in_cents();
      let six = make_request(Some(Veo2TextToVideoDuration::SixSeconds)).calculate_cost_in_cents();
      assert_eq!(six - five, 50);
    }

    /// Aspect ratio, negative prompt, enhance_prompt, seed, and auto_fix must
    /// not affect the bill.
    #[test]
    fn cost_ignores_non_billing_fields() {
      let baseline = make_request(Some(Veo2TextToVideoDuration::EightSeconds)).calculate_cost_in_cents();
      let embellished = Veo2TextToVideoRequest {
        prompt: "different".to_string(),
        aspect_ratio: Some(Veo2TextToVideoAspectRatio::Square),
        duration: Some(Veo2TextToVideoDuration::EightSeconds),
        negative_prompt: Some("noise".to_string()),
        enhance_prompt: Some(false),
        seed: Some(99),
        auto_fix: Some(false),
      }.calculate_cost_in_cents();
      assert_eq!(baseline, embellished);
    }
  }
}
