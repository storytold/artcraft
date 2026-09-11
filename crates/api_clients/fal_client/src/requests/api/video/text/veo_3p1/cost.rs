use crate::requests::api::video::text::veo_3p1::api::{
  Veo3p1TextToVideoDuration, Veo3p1TextToVideoRequest, Veo3p1TextToVideoResolution,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Veo 3.1 (non-fast) pricing (see https://fal.ai/models/fal-ai/veo3.1):
//   720p / 1080p: $0.20/sec (audio off), $0.40/sec (audio on)
//   4k:           $0.40/sec (audio off), $0.60/sec (audio on)
//
// Rates are stored in tenths-of-a-cent per second, multiplied by duration and
// rounded UP to whole cents so the user is never undercharged. These helpers
// are the canonical Veo 3.1 rate table, reused by the image/images/reference/
// extend modalities.
const RATE_SD_AUDIO_OFF: u64 = 200; // $0.20/sec
const RATE_SD_AUDIO_ON: u64 = 400; // $0.40/sec
const RATE_4K_AUDIO_OFF: u64 = 400; // $0.40/sec
const RATE_4K_AUDIO_ON: u64 = 600; // $0.60/sec

/// Per-second rate in tenths-of-a-cent for the Veo 3.1 (non-fast) family.
/// `four_k` selects the higher 4k tier; `audio_on` selects the audio surcharge.
pub(crate) fn veo_3p1_rate_tenth_cents_per_sec(four_k: bool, audio_on: bool) -> u64 {
  match (four_k, audio_on) {
    (false, false) => RATE_SD_AUDIO_OFF,
    (false, true) => RATE_SD_AUDIO_ON,
    (true, false) => RATE_4K_AUDIO_OFF,
    (true, true) => RATE_4K_AUDIO_ON,
  }
}

/// ceil(rate_tenth_cents × seconds / 10) → whole cents.
pub(crate) fn veo_3p1_cost_cents(rate_tenth_cents_per_sec: u64, duration_secs: u64) -> UsdCents {
  (rate_tenth_cents_per_sec * duration_secs + 9) / 10
}

impl FalRequestCostCalculator for Veo3p1TextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1TextToVideoDuration::EightSeconds)
      .to_seconds();
    let four_k = self.resolution
      .unwrap_or(Veo3p1TextToVideoResolution::SevenTwentyP)
      .is_four_k();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_rate_tenth_cents_per_sec(four_k, audio_on);
    veo_3p1_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::veo_3p1::api::{
    Veo3p1TextToVideoAspectRatio, Veo3p1TextToVideoSafetyTolerance,
  };

  fn make_request(
    duration: Option<Veo3p1TextToVideoDuration>,
    resolution: Option<Veo3p1TextToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1TextToVideoRequest {
    Veo3p1TextToVideoRequest {
      prompt: "test".to_string(),
      aspect_ratio: Some(Veo3p1TextToVideoAspectRatio::SixteenByNine),
      duration,
      resolution,
      negative_prompt: None,
      generate_audio,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  /// fal: "a 5 second video at 1080p with audio on will cost $2.00".
  /// The enum has no 5s variant, but the same $0.40/sec (1080p audio-on) rate
  /// must reproduce it: 5s × 400 tenth-cents / 10 = 200¢.
  #[test]
  fn matches_documented_5s_1080p_audio_on_example() {
    let rate = veo_3p1_rate_tenth_cents_per_sec(false, true);
    assert_eq!(veo_3p1_cost_cents(rate, 5), 200);
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, generate_audio, expected_cents)
    const COST_TABLE: &[(
      Option<Veo3p1TextToVideoDuration>,
      Option<Veo3p1TextToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      // 720p, audio off ($0.20/s)
      (Some(Veo3p1TextToVideoDuration::FourSeconds),  Some(Veo3p1TextToVideoResolution::SevenTwentyP), Some(false), 80),
      (Some(Veo3p1TextToVideoDuration::SixSeconds),   Some(Veo3p1TextToVideoResolution::SevenTwentyP), Some(false), 120),
      (Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::SevenTwentyP), Some(false), 160),
      // 720p, audio on ($0.40/s)
      (Some(Veo3p1TextToVideoDuration::FourSeconds),  Some(Veo3p1TextToVideoResolution::SevenTwentyP), Some(true),  160),
      (Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::SevenTwentyP), Some(true),  320),
      // 1080p bills the same as 720p
      (Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::TenEightyP),   Some(false), 160),
      (Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::TenEightyP),   Some(true),  320),
      // 4k, audio off ($0.40/s) and on ($0.60/s)
      (Some(Veo3p1TextToVideoDuration::FourSeconds),  Some(Veo3p1TextToVideoResolution::FourK),        Some(false), 160),
      (Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::FourK),        Some(false), 320),
      (Some(Veo3p1TextToVideoDuration::FourSeconds),  Some(Veo3p1TextToVideoResolution::FourK),        Some(true),  240),
      (Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::FourK),        Some(true),  480),
      // Defaults: duration=None→8s, resolution=None→720p, audio=None→on
      (None, None, None, 320),
      (None, None, Some(false), 160),
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
    fn audio_on_is_more_expensive_than_off() {
      for res in [
        Veo3p1TextToVideoResolution::SevenTwentyP,
        Veo3p1TextToVideoResolution::TenEightyP,
        Veo3p1TextToVideoResolution::FourK,
      ] {
        let off = make_request(Some(Veo3p1TextToVideoDuration::EightSeconds), Some(res), Some(false))
          .calculate_cost_in_cents();
        let on = make_request(Some(Veo3p1TextToVideoDuration::EightSeconds), Some(res), Some(true))
          .calculate_cost_in_cents();
        assert!(on > off, "resolution={res:?}: audio_on={on}¢ should exceed audio_off={off}¢");
      }
    }

    #[test]
    fn four_k_is_more_expensive_than_sd() {
      for audio in [Some(false), Some(true)] {
        let sd = make_request(Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::TenEightyP), audio)
          .calculate_cost_in_cents();
        let four_k = make_request(Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::FourK), audio)
          .calculate_cost_in_cents();
        assert!(four_k > sd, "audio={audio:?}: 4k={four_k}¢ should exceed 1080p={sd}¢");
      }
    }

    #[test]
    fn seven_twenty_and_ten_eighty_cost_the_same() {
      for audio in [Some(false), Some(true), None] {
        let sd = make_request(Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::SevenTwentyP), audio)
          .calculate_cost_in_cents();
        let hd = make_request(Some(Veo3p1TextToVideoDuration::EightSeconds), Some(Veo3p1TextToVideoResolution::TenEightyP), audio)
          .calculate_cost_in_cents();
        assert_eq!(sd, hd, "audio={audio:?}: 720p and 1080p should bill the same");
      }
    }

    /// Neither aspect ratio, seed, auto_fix, nor safety tolerance affect the bill.
    #[test]
    fn cost_ignores_non_billing_fields() {
      let baseline = make_request(
        Some(Veo3p1TextToVideoDuration::EightSeconds),
        Some(Veo3p1TextToVideoResolution::TenEightyP),
        Some(true),
      ).calculate_cost_in_cents();

      let embellished = Veo3p1TextToVideoRequest {
        prompt: "different prompt".to_string(),
        aspect_ratio: Some(Veo3p1TextToVideoAspectRatio::NineBySixteen),
        duration: Some(Veo3p1TextToVideoDuration::EightSeconds),
        resolution: Some(Veo3p1TextToVideoResolution::TenEightyP),
        negative_prompt: Some("noise".to_string()),
        generate_audio: Some(true),
        seed: Some(99),
        auto_fix: Some(false),
        safety_tolerance: Some(Veo3p1TextToVideoSafetyTolerance::Level1),
      }.calculate_cost_in_cents();

      assert_eq!(baseline, embellished);
    }
  }
}
