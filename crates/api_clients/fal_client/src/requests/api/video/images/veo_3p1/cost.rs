use crate::requests::api::video::images::veo_3p1::api::{
  Veo3p1FirstLastFrameToVideoDuration, Veo3p1FirstLastFrameToVideoRequest,
  Veo3p1FirstLastFrameToVideoResolution,
};
use crate::requests::api::video::text::veo_3p1::cost::{
  veo_3p1_cost_cents, veo_3p1_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// First-last-frame-to-video shares the Veo 3.1 (non-fast) per-second pricing
// (see the text module for the canonical rate table):
//   720p / 1080p: $0.20/sec (audio off), $0.40/sec (audio on)
//   4k:           $0.40/sec (audio off), $0.60/sec (audio on)

impl FalRequestCostCalculator for Veo3p1FirstLastFrameToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1FirstLastFrameToVideoDuration::EightSeconds)
      .to_seconds();
    let four_k = self.resolution
      .unwrap_or(Veo3p1FirstLastFrameToVideoResolution::SevenTwentyP)
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
    duration: Option<Veo3p1FirstLastFrameToVideoDuration>,
    resolution: Option<Veo3p1FirstLastFrameToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1FirstLastFrameToVideoRequest {
    Veo3p1FirstLastFrameToVideoRequest {
      prompt: "test".to_string(),
      first_frame_url: "https://example.com/first.png".to_string(),
      last_frame_url: "https://example.com/last.png".to_string(),
      aspect_ratio: None,
      duration,
      resolution,
      generate_audio,
      negative_prompt: None,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3p1FirstLastFrameToVideoDuration>,
      Option<Veo3p1FirstLastFrameToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3p1FirstLastFrameToVideoDuration::FourSeconds),  Some(Veo3p1FirstLastFrameToVideoResolution::SevenTwentyP), Some(false), 80),
      (Some(Veo3p1FirstLastFrameToVideoDuration::SixSeconds),   Some(Veo3p1FirstLastFrameToVideoResolution::SevenTwentyP), Some(true),  240),
      (Some(Veo3p1FirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1FirstLastFrameToVideoResolution::TenEightyP),   Some(false), 160),
      (Some(Veo3p1FirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1FirstLastFrameToVideoResolution::TenEightyP),   Some(true),  320),
      (Some(Veo3p1FirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1FirstLastFrameToVideoResolution::FourK),        Some(false), 320),
      (Some(Veo3p1FirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1FirstLastFrameToVideoResolution::FourK),        Some(true),  480),
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
  }
}
