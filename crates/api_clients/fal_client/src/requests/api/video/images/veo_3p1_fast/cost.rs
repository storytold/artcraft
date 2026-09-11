use crate::requests::api::video::images::veo_3p1_fast::api::{
  Veo3p1FastFirstLastFrameToVideoDuration, Veo3p1FastFirstLastFrameToVideoRequest,
  Veo3p1FastFirstLastFrameToVideoResolution,
};
use crate::requests::api::video::text::veo_3p1_fast::cost::{
  veo_3p1_fast_cost_cents, veo_3p1_fast_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// First-last-frame-to-video shares the Veo 3.1 Fast per-second pricing (see the
// text module for the canonical rate table):
//   720p / 1080p: $0.10/sec (audio off), $0.15/sec (audio on)
//   4k:           $0.30/sec (audio off), $0.35/sec (audio on)

impl FalRequestCostCalculator for Veo3p1FastFirstLastFrameToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1FastFirstLastFrameToVideoDuration::EightSeconds)
      .to_seconds();
    let four_k = self.resolution
      .unwrap_or(Veo3p1FastFirstLastFrameToVideoResolution::SevenTwentyP)
      .is_four_k();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_fast_rate_tenth_cents_per_sec(four_k, audio_on);
    veo_3p1_fast_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    duration: Option<Veo3p1FastFirstLastFrameToVideoDuration>,
    resolution: Option<Veo3p1FastFirstLastFrameToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1FastFirstLastFrameToVideoRequest {
    Veo3p1FastFirstLastFrameToVideoRequest {
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
      Option<Veo3p1FastFirstLastFrameToVideoDuration>,
      Option<Veo3p1FastFirstLastFrameToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3p1FastFirstLastFrameToVideoDuration::FourSeconds),  Some(Veo3p1FastFirstLastFrameToVideoResolution::SevenTwentyP), Some(false), 40),
      (Some(Veo3p1FastFirstLastFrameToVideoDuration::SixSeconds),   Some(Veo3p1FastFirstLastFrameToVideoResolution::SevenTwentyP), Some(true),  90),
      (Some(Veo3p1FastFirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1FastFirstLastFrameToVideoResolution::TenEightyP),   Some(false), 80),
      (Some(Veo3p1FastFirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1FastFirstLastFrameToVideoResolution::TenEightyP),   Some(true),  120),
      (Some(Veo3p1FastFirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1FastFirstLastFrameToVideoResolution::FourK),        Some(false), 240),
      (Some(Veo3p1FastFirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1FastFirstLastFrameToVideoResolution::FourK),        Some(true),  280),
      (None, None, None, 120),
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
