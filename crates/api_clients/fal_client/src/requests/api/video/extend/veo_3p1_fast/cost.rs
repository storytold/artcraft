use crate::requests::api::video::extend::veo_3p1_fast::api::{
  Veo3p1FastExtendVideoDuration, Veo3p1FastExtendVideoRequest,
};
use crate::requests::api::video::text::veo_3p1_fast::cost::{
  veo_3p1_fast_cost_cents, veo_3p1_fast_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Extend-video pricing (see https://fal.ai/models/fal-ai/veo3.1/fast/extend-video):
//   $0.10/sec (audio off), $0.15/sec (audio on).
//
// Extend exposes only 720p/1080p (no 4k tier), so it always bills at the
// family's SD rate — `four_k` is fixed to `false`.

impl FalRequestCostCalculator for Veo3p1FastExtendVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 7s, audio = on. Resolution does not
    // affect price here (720p and 1080p bill identically).
    let duration_secs = self.duration
      .unwrap_or(Veo3p1FastExtendVideoDuration::SevenSeconds)
      .to_seconds();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_fast_rate_tenth_cents_per_sec(false, audio_on);
    veo_3p1_fast_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::extend::veo_3p1_fast::api::Veo3p1FastExtendVideoResolution;

  fn make_request(
    duration: Option<Veo3p1FastExtendVideoDuration>,
    generate_audio: Option<bool>,
  ) -> Veo3p1FastExtendVideoRequest {
    Veo3p1FastExtendVideoRequest {
      prompt: "test".to_string(),
      video_url: "https://example.com/in.mp4".to_string(),
      aspect_ratio: None,
      duration,
      resolution: None,
      negative_prompt: None,
      generate_audio,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  mod cost_table {
    use super::*;

    // (duration, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3p1FastExtendVideoDuration>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3p1FastExtendVideoDuration::FourSeconds),  Some(false), 40),
      (Some(Veo3p1FastExtendVideoDuration::FourSeconds),  Some(true),  60),
      (Some(Veo3p1FastExtendVideoDuration::SevenSeconds), Some(false), 70),
      (Some(Veo3p1FastExtendVideoDuration::SevenSeconds), Some(true),  105),
      (Some(Veo3p1FastExtendVideoDuration::EightSeconds), Some(false), 80),
      (Some(Veo3p1FastExtendVideoDuration::EightSeconds), Some(true),  120),
      // Defaults: 7s, audio on
      (None, None, 105),
      (None, Some(false), 70),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, generate_audio, expected) in COST_TABLE {
        let got = make_request(duration, generate_audio).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} audio={generate_audio:?}");
      }
    }

    #[test]
    fn default_duration_is_seven_seconds() {
      // duration=None, audio=on → 7s @ $0.15 = 105¢
      assert_eq!(make_request(None, None).calculate_cost_in_cents(), 105);
    }

    /// Resolution (720p vs 1080p) must not change the bill for extend.
    #[test]
    fn cost_is_independent_of_resolution() {
      for audio in [Some(false), Some(true), None] {
        let base = make_request(Some(Veo3p1FastExtendVideoDuration::SevenSeconds), audio)
          .calculate_cost_in_cents();
        for res in [Veo3p1FastExtendVideoResolution::SevenTwentyP, Veo3p1FastExtendVideoResolution::TenEightyP] {
          let cost = Veo3p1FastExtendVideoRequest {
            resolution: Some(res),
            ..make_request(Some(Veo3p1FastExtendVideoDuration::SevenSeconds), audio)
          }.calculate_cost_in_cents();
          assert_eq!(cost, base, "audio={audio:?} res={res:?}");
        }
      }
    }
  }
}
