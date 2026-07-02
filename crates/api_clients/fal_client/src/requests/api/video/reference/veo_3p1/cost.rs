use crate::requests::api::video::reference::veo_3p1::api::{
  Veo3p1ReferenceToVideoDuration, Veo3p1ReferenceToVideoRequest, Veo3p1ReferenceToVideoResolution,
};
use crate::requests::api::video::text::veo_3p1::cost::{
  veo_3p1_cost_cents, veo_3p1_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Reference-to-video shares the Veo 3.1 (non-fast) per-second pricing (see the
// text module for the canonical rate table). fal's reference-to-video docs
// explicitly document the 4k tier for this endpoint:
//   720p / 1080p: $0.20/sec (audio off), $0.40/sec (audio on)
//   4k:           $0.40/sec (audio off), $0.60/sec (audio on)

impl FalRequestCostCalculator for Veo3p1ReferenceToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1ReferenceToVideoDuration::EightSeconds)
      .to_seconds();
    let four_k = self.resolution
      .unwrap_or(Veo3p1ReferenceToVideoResolution::SevenTwentyP)
      .is_four_k();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_rate_tenth_cents_per_sec(four_k, audio_on);
    veo_3p1_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    duration: Option<Veo3p1ReferenceToVideoDuration>,
    resolution: Option<Veo3p1ReferenceToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1ReferenceToVideoRequest {
    Veo3p1ReferenceToVideoRequest {
      prompt: "test".to_string(),
      image_urls: vec!["https://example.com/a.png".to_string()],
      aspect_ratio: None,
      duration,
      resolution,
      generate_audio,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  /// fal reference-to-video docs: "8 second video at 1080p with audio on will
  /// cost $3.20" → 8s × $0.40 = 320¢.
  #[test]
  fn matches_documented_8s_1080p_audio_on_example() {
    let cost = make_request(
      Some(Veo3p1ReferenceToVideoDuration::EightSeconds),
      Some(Veo3p1ReferenceToVideoResolution::TenEightyP),
      Some(true),
    ).calculate_cost_in_cents();
    assert_eq!(cost, 320);
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3p1ReferenceToVideoDuration>,
      Option<Veo3p1ReferenceToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3p1ReferenceToVideoDuration::FourSeconds),  Some(Veo3p1ReferenceToVideoResolution::SevenTwentyP), Some(false), 80),
      (Some(Veo3p1ReferenceToVideoDuration::FourSeconds),  Some(Veo3p1ReferenceToVideoResolution::SevenTwentyP), Some(true),  160),
      (Some(Veo3p1ReferenceToVideoDuration::EightSeconds), Some(Veo3p1ReferenceToVideoResolution::TenEightyP),   Some(false), 160),
      (Some(Veo3p1ReferenceToVideoDuration::EightSeconds), Some(Veo3p1ReferenceToVideoResolution::TenEightyP),   Some(true),  320),
      (Some(Veo3p1ReferenceToVideoDuration::EightSeconds), Some(Veo3p1ReferenceToVideoResolution::FourK),        Some(false), 320),
      (Some(Veo3p1ReferenceToVideoDuration::EightSeconds), Some(Veo3p1ReferenceToVideoResolution::FourK),        Some(true),  480),
      (None, None, None, 320),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, resolution, generate_audio, expected) in COST_TABLE {
        let got = make_request(duration, resolution, generate_audio).calculate_cost_in_cents();
        assert_eq!(
          got, expected,
          "duration={duration:?} resolution={resolution:?} audio={generate_audio:?}",
        );
      }
    }

    /// The number of reference images does not affect the bill.
    #[test]
    fn cost_is_independent_of_image_count() {
      let one = Veo3p1ReferenceToVideoRequest {
        image_urls: vec!["https://example.com/a.png".to_string()],
        ..make_request(Some(Veo3p1ReferenceToVideoDuration::EightSeconds), Some(Veo3p1ReferenceToVideoResolution::TenEightyP), Some(true))
      }.calculate_cost_in_cents();
      let many = Veo3p1ReferenceToVideoRequest {
        image_urls: vec![
          "https://example.com/a.png".to_string(),
          "https://example.com/b.png".to_string(),
          "https://example.com/c.png".to_string(),
        ],
        ..make_request(Some(Veo3p1ReferenceToVideoDuration::EightSeconds), Some(Veo3p1ReferenceToVideoResolution::TenEightyP), Some(true))
      }.calculate_cost_in_cents();
      assert_eq!(one, many);
    }
  }
}
