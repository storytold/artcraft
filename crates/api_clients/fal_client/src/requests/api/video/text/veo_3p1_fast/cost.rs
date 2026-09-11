use crate::requests::api::video::text::veo_3p1_fast::api::{
  Veo3p1FastTextToVideoDuration, Veo3p1FastTextToVideoRequest, Veo3p1FastTextToVideoResolution,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Veo 3.1 Fast pricing (see https://fal.ai/models/fal-ai/veo3.1/fast):
//   720p / 1080p: $0.10/sec (audio off), $0.15/sec (audio on)
//   4k:           $0.30/sec (audio off), $0.35/sec (audio on)
//
// Rates are stored in tenths-of-a-cent per second so the per-second price is
// exact, then multiplied by duration and rounded UP to whole cents so the
// user is never undercharged.
const RATE_SD_AUDIO_OFF: u64 = 100; // $0.10/sec
const RATE_SD_AUDIO_ON: u64 = 150; // $0.15/sec
const RATE_4K_AUDIO_OFF: u64 = 300; // $0.30/sec
const RATE_4K_AUDIO_ON: u64 = 350; // $0.35/sec

/// Per-second rate in tenths-of-a-cent for the Veo 3.1 Fast family.
/// `four_k` selects the higher 4k tier; `audio_on` selects the audio surcharge.
pub(crate) fn veo_3p1_fast_rate_tenth_cents_per_sec(four_k: bool, audio_on: bool) -> u64 {
  match (four_k, audio_on) {
    (false, false) => RATE_SD_AUDIO_OFF,
    (false, true) => RATE_SD_AUDIO_ON,
    (true, false) => RATE_4K_AUDIO_OFF,
    (true, true) => RATE_4K_AUDIO_ON,
  }
}

/// ceil(rate_tenth_cents × seconds / 10) → whole cents.
pub(crate) fn veo_3p1_fast_cost_cents(rate_tenth_cents_per_sec: u64, duration_secs: u64) -> UsdCents {
  (rate_tenth_cents_per_sec * duration_secs + 9) / 10
}

impl FalRequestCostCalculator for Veo3p1FastTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1FastTextToVideoDuration::EightSeconds)
      .to_seconds();
    let four_k = self.resolution
      .unwrap_or(Veo3p1FastTextToVideoResolution::SevenTwentyP)
      .is_four_k();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_fast_rate_tenth_cents_per_sec(four_k, audio_on);
    veo_3p1_fast_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::veo_3p1_fast::api::{
    Veo3p1FastTextToVideoAspectRatio, Veo3p1FastTextToVideoSafetyTolerance,
  };

  fn make_request(
    duration: Option<Veo3p1FastTextToVideoDuration>,
    resolution: Option<Veo3p1FastTextToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1FastTextToVideoRequest {
    Veo3p1FastTextToVideoRequest {
      prompt: "test".to_string(),
      aspect_ratio: Some(Veo3p1FastTextToVideoAspectRatio::SixteenByNine),
      duration,
      resolution,
      negative_prompt: None,
      generate_audio,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  // ── Documented example ──

  /// fal: "a 5 second video at 1080p with audio on will cost $0.75".
  /// The enum has no 5s variant, but the same $0.15/sec (1080p audio-on) rate
  /// must reproduce it: 5s × 150 tenth-cents / 10 = 75¢.
  #[test]
  fn matches_documented_5s_1080p_audio_on_example() {
    let rate = veo_3p1_fast_rate_tenth_cents_per_sec(false, true);
    assert_eq!(veo_3p1_fast_cost_cents(rate, 5), 75);
  }

  // ── Cost table over every cost-relevant permutation ──

  mod cost_table {
    use super::*;

    // (duration, resolution, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3p1FastTextToVideoDuration>,
      Option<Veo3p1FastTextToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      // 720p, audio off ($0.10/s)
      (Some(Veo3p1FastTextToVideoDuration::FourSeconds),  Some(Veo3p1FastTextToVideoResolution::SevenTwentyP), Some(false), 40),
      (Some(Veo3p1FastTextToVideoDuration::SixSeconds),   Some(Veo3p1FastTextToVideoResolution::SevenTwentyP), Some(false), 60),
      (Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::SevenTwentyP), Some(false), 80),
      // 720p, audio on ($0.15/s)
      (Some(Veo3p1FastTextToVideoDuration::FourSeconds),  Some(Veo3p1FastTextToVideoResolution::SevenTwentyP), Some(true),  60),
      (Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::SevenTwentyP), Some(true),  120),
      // 1080p bills the same as 720p
      (Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::TenEightyP),   Some(false), 80),
      (Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::TenEightyP),   Some(true),  120),
      // 4k, audio off ($0.30/s) and on ($0.35/s)
      (Some(Veo3p1FastTextToVideoDuration::FourSeconds),  Some(Veo3p1FastTextToVideoResolution::FourK),        Some(false), 120),
      (Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::FourK),        Some(false), 240),
      (Some(Veo3p1FastTextToVideoDuration::FourSeconds),  Some(Veo3p1FastTextToVideoResolution::FourK),        Some(true),  140),
      (Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::FourK),        Some(true),  280),
      // Defaults: duration=None→8s, resolution=None→720p, audio=None→on
      (None, None, None, 120),
      (None, None, Some(false), 80),
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

    #[test]
    fn defaults_match_8s_720p_audio_on() {
      assert_eq!(make_request(None, None, None).calculate_cost_in_cents(), 120);
    }

    #[test]
    fn audio_on_is_more_expensive_than_off() {
      for res in [
        Veo3p1FastTextToVideoResolution::SevenTwentyP,
        Veo3p1FastTextToVideoResolution::TenEightyP,
        Veo3p1FastTextToVideoResolution::FourK,
      ] {
        let off = make_request(Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(res), Some(false))
          .calculate_cost_in_cents();
        let on = make_request(Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(res), Some(true))
          .calculate_cost_in_cents();
        assert!(on > off, "resolution={res:?}: audio_on={on}¢ should exceed audio_off={off}¢");
      }
    }

    #[test]
    fn four_k_is_more_expensive_than_sd() {
      for audio in [Some(false), Some(true)] {
        let sd = make_request(Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::TenEightyP), audio)
          .calculate_cost_in_cents();
        let four_k = make_request(Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::FourK), audio)
          .calculate_cost_in_cents();
        assert!(four_k > sd, "audio={audio:?}: 4k={four_k}¢ should exceed 1080p={sd}¢");
      }
    }

    #[test]
    fn seven_twenty_and_ten_eighty_cost_the_same() {
      for audio in [Some(false), Some(true), None] {
        let sd = make_request(Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::SevenTwentyP), audio)
          .calculate_cost_in_cents();
        let hd = make_request(Some(Veo3p1FastTextToVideoDuration::EightSeconds), Some(Veo3p1FastTextToVideoResolution::TenEightyP), audio)
          .calculate_cost_in_cents();
        assert_eq!(sd, hd, "audio={audio:?}: 720p and 1080p should bill the same");
      }
    }

    /// Neither aspect ratio, seed, auto_fix, nor safety tolerance affect the bill.
    #[test]
    fn cost_ignores_non_billing_fields() {
      let baseline = make_request(
        Some(Veo3p1FastTextToVideoDuration::EightSeconds),
        Some(Veo3p1FastTextToVideoResolution::TenEightyP),
        Some(true),
      ).calculate_cost_in_cents();

      let embellished = Veo3p1FastTextToVideoRequest {
        prompt: "different prompt".to_string(),
        aspect_ratio: Some(Veo3p1FastTextToVideoAspectRatio::NineBySixteen),
        duration: Some(Veo3p1FastTextToVideoDuration::EightSeconds),
        resolution: Some(Veo3p1FastTextToVideoResolution::TenEightyP),
        negative_prompt: Some("noise".to_string()),
        generate_audio: Some(true),
        seed: Some(99),
        auto_fix: Some(false),
        safety_tolerance: Some(Veo3p1FastTextToVideoSafetyTolerance::Level1),
      }.calculate_cost_in_cents();

      assert_eq!(baseline, embellished);
    }
  }
}
