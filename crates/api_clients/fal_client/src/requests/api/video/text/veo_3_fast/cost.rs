use crate::requests::api::video::text::veo_3_fast::api::{
  Veo3FastTextToVideoDuration, Veo3FastTextToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Veo 3 Fast pricing (see https://fal.ai/models/fal-ai/veo3/fast):
//   $0.10/sec (audio off), $0.15/sec (audio on). Flat — Veo 3 Fast has no 4k
//   tier and resolution (720p/1080p) does not change the price.
//
// Rates are stored in tenths-of-a-cent per second, multiplied by duration and
// rounded UP to whole cents so the user is never undercharged. These helpers
// are the canonical Veo 3 Fast rate table, reused by the image-to-video modality.
const RATE_AUDIO_OFF: u64 = 100; // $0.10/sec
const RATE_AUDIO_ON: u64 = 150; // $0.15/sec

/// Per-second rate in tenths-of-a-cent for the Veo 3 Fast family.
pub(crate) fn veo_3_fast_rate_tenth_cents_per_sec(audio_on: bool) -> u64 {
  if audio_on { RATE_AUDIO_ON } else { RATE_AUDIO_OFF }
}

/// ceil(rate_tenth_cents × seconds / 10) → whole cents.
pub(crate) fn veo_3_fast_cost_cents(rate_tenth_cents_per_sec: u64, duration_secs: u64) -> UsdCents {
  (rate_tenth_cents_per_sec * duration_secs + 9) / 10
}

impl FalRequestCostCalculator for Veo3FastTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, audio = on. Resolution does not
    // affect price.
    let duration_secs = self.duration
      .unwrap_or(Veo3FastTextToVideoDuration::EightSeconds)
      .to_seconds();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3_fast_rate_tenth_cents_per_sec(audio_on);
    veo_3_fast_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::veo_3_fast::api::{
    Veo3FastTextToVideoAspectRatio, Veo3FastTextToVideoResolution, Veo3FastTextToVideoSafetyTolerance,
  };

  fn make_request(
    duration: Option<Veo3FastTextToVideoDuration>,
    generate_audio: Option<bool>,
  ) -> Veo3FastTextToVideoRequest {
    Veo3FastTextToVideoRequest {
      prompt: "test".to_string(),
      aspect_ratio: Some(Veo3FastTextToVideoAspectRatio::SixteenByNine),
      duration,
      resolution: None,
      negative_prompt: None,
      generate_audio,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  /// fal: "a 5s video with audio on will cost $0.75" → 5s × $0.15 = 75¢.
  #[test]
  fn matches_documented_5s_audio_on_example() {
    let rate = veo_3_fast_rate_tenth_cents_per_sec(true);
    assert_eq!(veo_3_fast_cost_cents(rate, 5), 75);
  }

  mod cost_table {
    use super::*;

    // (duration, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3FastTextToVideoDuration>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3FastTextToVideoDuration::FourSeconds),  Some(false), 40),
      (Some(Veo3FastTextToVideoDuration::FourSeconds),  Some(true),  60),
      (Some(Veo3FastTextToVideoDuration::SixSeconds),   Some(false), 60),
      (Some(Veo3FastTextToVideoDuration::EightSeconds), Some(false), 80),
      (Some(Veo3FastTextToVideoDuration::EightSeconds), Some(true),  120),
      // Defaults: duration=None→8s, audio=None→on
      (None, None, 120),
      (None, Some(false), 80),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, generate_audio, expected) in COST_TABLE {
        let got = make_request(duration, generate_audio).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} audio={generate_audio:?}");
      }
    }

    #[test]
    fn cost_is_independent_of_resolution() {
      for audio in [Some(false), Some(true), None] {
        let base = make_request(Some(Veo3FastTextToVideoDuration::EightSeconds), audio).calculate_cost_in_cents();
        for res in [Veo3FastTextToVideoResolution::SevenTwentyP, Veo3FastTextToVideoResolution::TenEightyP] {
          let cost = Veo3FastTextToVideoRequest {
            resolution: Some(res),
            ..make_request(Some(Veo3FastTextToVideoDuration::EightSeconds), audio)
          }.calculate_cost_in_cents();
          assert_eq!(cost, base, "audio={audio:?} res={res:?}");
        }
      }
    }

    #[test]
    fn cost_ignores_non_billing_fields() {
      let baseline = make_request(Some(Veo3FastTextToVideoDuration::EightSeconds), Some(true)).calculate_cost_in_cents();
      let embellished = Veo3FastTextToVideoRequest {
        prompt: "different".to_string(),
        aspect_ratio: Some(Veo3FastTextToVideoAspectRatio::NineBySixteen),
        duration: Some(Veo3FastTextToVideoDuration::EightSeconds),
        resolution: Some(Veo3FastTextToVideoResolution::TenEightyP),
        negative_prompt: Some("noise".to_string()),
        generate_audio: Some(true),
        seed: Some(99),
        auto_fix: Some(false),
        safety_tolerance: Some(Veo3FastTextToVideoSafetyTolerance::Level1),
      }.calculate_cost_in_cents();
      assert_eq!(baseline, embellished);
    }
  }
}
