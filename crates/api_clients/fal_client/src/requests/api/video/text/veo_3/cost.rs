use crate::requests::api::video::text::veo_3::api::{
  Veo3TextToVideoDuration, Veo3TextToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Veo 3 (non-fast) pricing (see https://fal.ai/models/fal-ai/veo3):
//   $0.20/sec (audio off), $0.40/sec (audio on). Flat — Veo 3 has no 4k tier
//   and resolution (720p/1080p) does not change the price.
//
// Rates are stored in tenths-of-a-cent per second, multiplied by duration and
// rounded UP to whole cents so the user is never undercharged. These helpers
// are the canonical Veo 3 rate table, reused by the image-to-video modality.
const RATE_AUDIO_OFF: u64 = 200; // $0.20/sec
const RATE_AUDIO_ON: u64 = 400; // $0.40/sec

/// Per-second rate in tenths-of-a-cent for the Veo 3 (non-fast) family.
pub(crate) fn veo_3_rate_tenth_cents_per_sec(audio_on: bool) -> u64 {
  if audio_on { RATE_AUDIO_ON } else { RATE_AUDIO_OFF }
}

/// ceil(rate_tenth_cents × seconds / 10) → whole cents.
pub(crate) fn veo_3_cost_cents(rate_tenth_cents_per_sec: u64, duration_secs: u64) -> UsdCents {
  (rate_tenth_cents_per_sec * duration_secs + 9) / 10
}

impl FalRequestCostCalculator for Veo3TextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, audio = on. Resolution does not
    // affect price.
    let duration_secs = self.duration
      .unwrap_or(Veo3TextToVideoDuration::EightSeconds)
      .to_seconds();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3_rate_tenth_cents_per_sec(audio_on);
    veo_3_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::veo_3::api::{
    Veo3TextToVideoAspectRatio, Veo3TextToVideoResolution, Veo3TextToVideoSafetyTolerance,
  };

  fn make_request(
    duration: Option<Veo3TextToVideoDuration>,
    generate_audio: Option<bool>,
  ) -> Veo3TextToVideoRequest {
    Veo3TextToVideoRequest {
      prompt: "test".to_string(),
      aspect_ratio: Some(Veo3TextToVideoAspectRatio::SixteenByNine),
      duration,
      resolution: None,
      negative_prompt: None,
      generate_audio,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  /// fal: "a 5s video with audio on will cost $2" → 5s × $0.40 = 200¢.
  #[test]
  fn matches_documented_5s_audio_on_example() {
    let rate = veo_3_rate_tenth_cents_per_sec(true);
    assert_eq!(veo_3_cost_cents(rate, 5), 200);
  }

  mod cost_table {
    use super::*;

    // (duration, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3TextToVideoDuration>,
      Option<bool>,
      u64,
    )] = &[
      (Some(Veo3TextToVideoDuration::FourSeconds),  Some(false), 80),
      (Some(Veo3TextToVideoDuration::FourSeconds),  Some(true),  160),
      (Some(Veo3TextToVideoDuration::SixSeconds),   Some(true),  240),
      (Some(Veo3TextToVideoDuration::EightSeconds), Some(false), 160),
      (Some(Veo3TextToVideoDuration::EightSeconds), Some(true),  320),
      // Defaults: duration=None→8s, audio=None→on
      (None, None, 320),
      (None, Some(false), 160),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, generate_audio, expected) in COST_TABLE {
        let got = make_request(duration, generate_audio).calculate_cost_in_cents();
        assert_eq!(got, expected, "duration={duration:?} audio={generate_audio:?}");
      }
    }

    #[test]
    fn audio_on_costs_twice_as_much_as_off() {
      for d in [Veo3TextToVideoDuration::FourSeconds, Veo3TextToVideoDuration::EightSeconds] {
        let off = make_request(Some(d), Some(false)).calculate_cost_in_cents();
        let on = make_request(Some(d), Some(true)).calculate_cost_in_cents();
        assert_eq!(on, off * 2, "duration={d:?}");
      }
    }

    /// Resolution (720p vs 1080p) must not change the bill for Veo 3.
    #[test]
    fn cost_is_independent_of_resolution() {
      for audio in [Some(false), Some(true), None] {
        let base = make_request(Some(Veo3TextToVideoDuration::EightSeconds), audio).calculate_cost_in_cents();
        for res in [Veo3TextToVideoResolution::SevenTwentyP, Veo3TextToVideoResolution::TenEightyP] {
          let cost = Veo3TextToVideoRequest {
            resolution: Some(res),
            ..make_request(Some(Veo3TextToVideoDuration::EightSeconds), audio)
          }.calculate_cost_in_cents();
          assert_eq!(cost, base, "audio={audio:?} res={res:?}");
        }
      }
    }

    /// Neither aspect ratio, seed, auto_fix, nor safety tolerance affect the bill.
    #[test]
    fn cost_ignores_non_billing_fields() {
      let baseline = make_request(Some(Veo3TextToVideoDuration::EightSeconds), Some(true)).calculate_cost_in_cents();
      let embellished = Veo3TextToVideoRequest {
        prompt: "different".to_string(),
        aspect_ratio: Some(Veo3TextToVideoAspectRatio::NineBySixteen),
        duration: Some(Veo3TextToVideoDuration::EightSeconds),
        resolution: Some(Veo3TextToVideoResolution::TenEightyP),
        negative_prompt: Some("noise".to_string()),
        generate_audio: Some(true),
        seed: Some(99),
        auto_fix: Some(false),
        safety_tolerance: Some(Veo3TextToVideoSafetyTolerance::Level1),
      }.calculate_cost_in_cents();
      assert_eq!(baseline, embellished);
    }
  }
}
