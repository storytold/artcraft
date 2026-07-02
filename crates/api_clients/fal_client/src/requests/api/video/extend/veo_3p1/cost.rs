use crate::requests::api::video::extend::veo_3p1::api::{
  Veo3p1ExtendVideoDuration, Veo3p1ExtendVideoRequest,
};
use crate::requests::api::video::text::veo_3p1::cost::{
  veo_3p1_cost_cents, veo_3p1_rate_tenth_cents_per_sec,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Extend-video pricing (see https://fal.ai/models/fal-ai/veo3.1/extend-video):
//   $0.20/sec (audio off), $0.40/sec (audio on).
//
// Extend exposes only 720p/1080p (no 4k tier), so it always bills at the
// family's SD rate — `four_k` is fixed to `false`.

impl FalRequestCostCalculator for Veo3p1ExtendVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 7s, audio = on. Resolution does not
    // affect price here (720p and 1080p bill identically).
    let duration_secs = self.duration
      .unwrap_or(Veo3p1ExtendVideoDuration::SevenSeconds)
      .to_seconds();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_rate_tenth_cents_per_sec(false, audio_on);
    veo_3p1_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::extend::veo_3p1::api::Veo3p1ExtendVideoResolution;

  fn make_request(
    duration: Option<Veo3p1ExtendVideoDuration>,
    generate_audio: Option<bool>,
  ) -> Veo3p1ExtendVideoRequest {
    Veo3p1ExtendVideoRequest {
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
      Option<Veo3p1ExtendVideoDuration>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3p1ExtendVideoDuration::FourSeconds),  Some(false), 80),
      (Some(Veo3p1ExtendVideoDuration::FourSeconds),  Some(true),  160),
      (Some(Veo3p1ExtendVideoDuration::SevenSeconds), Some(false), 140),
      (Some(Veo3p1ExtendVideoDuration::SevenSeconds), Some(true),  280),
      (Some(Veo3p1ExtendVideoDuration::EightSeconds), Some(false), 160),
      (Some(Veo3p1ExtendVideoDuration::EightSeconds), Some(true),  320),
      // Defaults: 7s, audio on
      (None, None, 280),
      (None, Some(false), 140),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, generate_audio, expected) in COST_TABLE {
        let got = make_request(duration, generate_audio).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} audio={generate_audio:?}");
      }
    }

    /// fal: "a 5s video with audio on will cost $2" → 5s × $0.40 = 200¢.
    #[test]
    fn matches_documented_5s_audio_on_example() {
      let rate = veo_3p1_rate_tenth_cents_per_sec(false, true);
      assert_eq!(veo_3p1_cost_cents(rate, 5), 200);
    }

    #[test]
    fn default_duration_is_seven_seconds() {
      // duration=None, audio=on → 7s @ $0.40 = 280¢
      assert_eq!(make_request(None, None).calculate_cost_in_cents(), 280);
    }

    /// Resolution (720p vs 1080p) must not change the bill for extend.
    #[test]
    fn cost_is_independent_of_resolution() {
      for audio in [Some(false), Some(true), None] {
        let base = make_request(Some(Veo3p1ExtendVideoDuration::SevenSeconds), audio)
          .calculate_cost_in_cents();
        for res in [Veo3p1ExtendVideoResolution::SevenTwentyP, Veo3p1ExtendVideoResolution::TenEightyP] {
          let cost = Veo3p1ExtendVideoRequest {
            resolution: Some(res),
            ..make_request(Some(Veo3p1ExtendVideoDuration::SevenSeconds), audio)
          }.calculate_cost_in_cents();
          assert_eq!(cost, base, "audio={audio:?} res={res:?}");
        }
      }
    }
  }
}
