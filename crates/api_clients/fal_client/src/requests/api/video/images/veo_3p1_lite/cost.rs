use crate::requests::api::video::images::veo_3p1_lite::api::{
  Veo3p1LiteFirstLastFrameToVideoDuration, Veo3p1LiteFirstLastFrameToVideoRequest,
  Veo3p1LiteFirstLastFrameToVideoResolution,
};
use crate::requests::api::video::text::veo_3p1_lite::cost::{
  veo_3p1_lite_cost_cents, veo_3p1_lite_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// First-last-frame-to-video shares the Veo 3.1 Lite per-second pricing (see the
// text module for the canonical rate table). Both resolution and audio matter:
//   720p:  $0.03/sec (audio off), $0.05/sec (audio on)
//   1080p: $0.05/sec (audio off), $0.08/sec (audio on)

impl FalRequestCostCalculator for Veo3p1LiteFirstLastFrameToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1LiteFirstLastFrameToVideoDuration::EightSeconds)
      .to_seconds();
    let is_1080p = self.resolution
      .unwrap_or(Veo3p1LiteFirstLastFrameToVideoResolution::SevenTwentyP)
      .is_ten_eighty_p();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_lite_rate_tenth_cents_per_sec(is_1080p, audio_on);
    veo_3p1_lite_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    duration: Option<Veo3p1LiteFirstLastFrameToVideoDuration>,
    resolution: Option<Veo3p1LiteFirstLastFrameToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1LiteFirstLastFrameToVideoRequest {
    Veo3p1LiteFirstLastFrameToVideoRequest {
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
      Option<Veo3p1LiteFirstLastFrameToVideoDuration>,
      Option<Veo3p1LiteFirstLastFrameToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3p1LiteFirstLastFrameToVideoDuration::FourSeconds),  Some(Veo3p1LiteFirstLastFrameToVideoResolution::SevenTwentyP), Some(false), 12),
      (Some(Veo3p1LiteFirstLastFrameToVideoDuration::FourSeconds),  Some(Veo3p1LiteFirstLastFrameToVideoResolution::SevenTwentyP), Some(true),  20),
      (Some(Veo3p1LiteFirstLastFrameToVideoDuration::SixSeconds),   Some(Veo3p1LiteFirstLastFrameToVideoResolution::TenEightyP),   Some(true),  48),
      (Some(Veo3p1LiteFirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1LiteFirstLastFrameToVideoResolution::TenEightyP),   Some(false), 40),
      (Some(Veo3p1LiteFirstLastFrameToVideoDuration::EightSeconds), Some(Veo3p1LiteFirstLastFrameToVideoResolution::TenEightyP),   Some(true),  64),
      // Defaults: 8s, 720p, audio on
      (None, None, None, 40),
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
