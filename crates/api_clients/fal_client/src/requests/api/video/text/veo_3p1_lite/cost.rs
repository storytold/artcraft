use crate::requests::api::video::text::veo_3p1_lite::api::{
  Veo3p1LiteTextToVideoDuration, Veo3p1LiteTextToVideoRequest, Veo3p1LiteTextToVideoResolution,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Veo 3.1 Lite pricing (see https://fal.ai/models/fal-ai/veo3.1/lite):
//   720p:  $0.03/sec (audio off), $0.05/sec (audio on)
//   1080p: $0.05/sec (audio off), $0.08/sec (audio on)
//
// Unlike the other Veo models, BOTH resolution and audio move the per-second
// price (and there is no 4k tier). Rates are stored in tenths-of-a-cent per
// second, multiplied by duration and rounded UP to whole cents so the user is
// never undercharged. These helpers are the canonical Veo 3.1 Lite rate table,
// reused by the image/images modalities.
const RATE_720P_AUDIO_OFF: u64 = 30; // $0.03/sec
const RATE_720P_AUDIO_ON: u64 = 50; // $0.05/sec
const RATE_1080P_AUDIO_OFF: u64 = 50; // $0.05/sec
const RATE_1080P_AUDIO_ON: u64 = 80; // $0.08/sec

/// Per-second rate in tenths-of-a-cent for Veo 3.1 Lite.
/// `is_1080p` selects the 1080p tier; `audio_on` selects the audio surcharge.
pub(crate) fn veo_3p1_lite_rate_tenth_cents_per_sec(is_1080p: bool, audio_on: bool) -> u64 {
  match (is_1080p, audio_on) {
    (false, false) => RATE_720P_AUDIO_OFF,
    (false, true) => RATE_720P_AUDIO_ON,
    (true, false) => RATE_1080P_AUDIO_OFF,
    (true, true) => RATE_1080P_AUDIO_ON,
  }
}

/// ceil(rate_tenth_cents × seconds / 10) → whole cents.
pub(crate) fn veo_3p1_lite_cost_cents(rate_tenth_cents_per_sec: u64, duration_secs: u64) -> UsdCents {
  (rate_tenth_cents_per_sec * duration_secs + 9) / 10
}

impl FalRequestCostCalculator for Veo3p1LiteTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // fal defaults when unset: duration = 8s, resolution = 720p, audio = on.
    let duration_secs = self.duration
      .unwrap_or(Veo3p1LiteTextToVideoDuration::EightSeconds)
      .to_seconds();
    let is_1080p = self.resolution
      .unwrap_or(Veo3p1LiteTextToVideoResolution::SevenTwentyP)
      .is_ten_eighty_p();
    let audio_on = self.generate_audio.unwrap_or(true);

    let rate = veo_3p1_lite_rate_tenth_cents_per_sec(is_1080p, audio_on);
    veo_3p1_lite_cost_cents(rate, duration_secs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::veo_3p1_lite::api::{
    Veo3p1LiteTextToVideoAspectRatio, Veo3p1LiteTextToVideoSafetyTolerance,
  };

  fn make_request(
    duration: Option<Veo3p1LiteTextToVideoDuration>,
    resolution: Option<Veo3p1LiteTextToVideoResolution>,
    generate_audio: Option<bool>,
  ) -> Veo3p1LiteTextToVideoRequest {
    Veo3p1LiteTextToVideoRequest {
      prompt: "test".to_string(),
      aspect_ratio: Some(Veo3p1LiteTextToVideoAspectRatio::SixteenByNine),
      duration,
      resolution,
      negative_prompt: None,
      generate_audio,
      seed: None,
      auto_fix: None,
      safety_tolerance: None,
    }
  }

  /// fal: "a 4 second video at 720p with audio will cost $0.20".
  #[test]
  fn matches_documented_4s_720p_audio_on_example() {
    let cost = make_request(
      Some(Veo3p1LiteTextToVideoDuration::FourSeconds),
      Some(Veo3p1LiteTextToVideoResolution::SevenTwentyP),
      Some(true),
    ).calculate_cost_in_cents();
    assert_eq!(cost, 20);
  }

  mod cost_table {
    use super::*;

    // (duration, resolution, generate_audio, expected_cents)
    // Math: ceil(rate × secs / 10) where rate (tenth-cents) is
    //   720p: 30 off / 50 on;  1080p: 50 off / 80 on.
    const COST_TABLE: &[(
      Option<Veo3p1LiteTextToVideoDuration>,
      Option<Veo3p1LiteTextToVideoResolution>,
      Option<bool>,
      u64,
    )] = &[
      // 720p audio off ($0.03/s)
      (Some(Veo3p1LiteTextToVideoDuration::FourSeconds),  Some(Veo3p1LiteTextToVideoResolution::SevenTwentyP), Some(false), 12),
      (Some(Veo3p1LiteTextToVideoDuration::SixSeconds),   Some(Veo3p1LiteTextToVideoResolution::SevenTwentyP), Some(false), 18),
      (Some(Veo3p1LiteTextToVideoDuration::EightSeconds), Some(Veo3p1LiteTextToVideoResolution::SevenTwentyP), Some(false), 24),
      // 720p audio on ($0.05/s)
      (Some(Veo3p1LiteTextToVideoDuration::FourSeconds),  Some(Veo3p1LiteTextToVideoResolution::SevenTwentyP), Some(true),  20),
      (Some(Veo3p1LiteTextToVideoDuration::EightSeconds), Some(Veo3p1LiteTextToVideoResolution::SevenTwentyP), Some(true),  40),
      // 1080p audio off ($0.05/s)
      (Some(Veo3p1LiteTextToVideoDuration::FourSeconds),  Some(Veo3p1LiteTextToVideoResolution::TenEightyP),   Some(false), 20),
      (Some(Veo3p1LiteTextToVideoDuration::EightSeconds), Some(Veo3p1LiteTextToVideoResolution::TenEightyP),   Some(false), 40),
      // 1080p audio on ($0.08/s)
      (Some(Veo3p1LiteTextToVideoDuration::FourSeconds),  Some(Veo3p1LiteTextToVideoResolution::TenEightyP),   Some(true),  32),
      (Some(Veo3p1LiteTextToVideoDuration::EightSeconds), Some(Veo3p1LiteTextToVideoResolution::TenEightyP),   Some(true),  64),
      // Defaults: duration=None→8s, resolution=None→720p, audio=None→on
      (None, None, None, 40),
      (None, None, Some(false), 24),
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
      for res in [Veo3p1LiteTextToVideoResolution::SevenTwentyP, Veo3p1LiteTextToVideoResolution::TenEightyP] {
        let off = make_request(Some(Veo3p1LiteTextToVideoDuration::EightSeconds), Some(res), Some(false)).calculate_cost_in_cents();
        let on = make_request(Some(Veo3p1LiteTextToVideoDuration::EightSeconds), Some(res), Some(true)).calculate_cost_in_cents();
        assert!(on > off, "res={res:?}: on={on}¢ should exceed off={off}¢");
      }
    }

    #[test]
    fn ten_eighty_p_is_more_expensive_than_seven_twenty() {
      for audio in [Some(false), Some(true)] {
        let sd = make_request(Some(Veo3p1LiteTextToVideoDuration::EightSeconds), Some(Veo3p1LiteTextToVideoResolution::SevenTwentyP), audio).calculate_cost_in_cents();
        let hd = make_request(Some(Veo3p1LiteTextToVideoDuration::EightSeconds), Some(Veo3p1LiteTextToVideoResolution::TenEightyP), audio).calculate_cost_in_cents();
        assert!(hd > sd, "audio={audio:?}: 1080p={hd}¢ should exceed 720p={sd}¢");
      }
    }

    /// Neither aspect ratio, seed, auto_fix, nor safety tolerance affect the bill.
    #[test]
    fn cost_ignores_non_billing_fields() {
      let baseline = make_request(
        Some(Veo3p1LiteTextToVideoDuration::EightSeconds),
        Some(Veo3p1LiteTextToVideoResolution::TenEightyP),
        Some(true),
      ).calculate_cost_in_cents();
      let embellished = Veo3p1LiteTextToVideoRequest {
        prompt: "different".to_string(),
        aspect_ratio: Some(Veo3p1LiteTextToVideoAspectRatio::NineBySixteen),
        duration: Some(Veo3p1LiteTextToVideoDuration::EightSeconds),
        resolution: Some(Veo3p1LiteTextToVideoResolution::TenEightyP),
        negative_prompt: Some("noise".to_string()),
        generate_audio: Some(true),
        seed: Some(99),
        auto_fix: Some(false),
        safety_tolerance: Some(Veo3p1LiteTextToVideoSafetyTolerance::Level1),
      }.calculate_cost_in_cents();
      assert_eq!(baseline, embellished);
    }
  }
}
