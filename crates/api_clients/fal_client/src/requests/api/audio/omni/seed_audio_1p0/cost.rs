use crate::requests::api::audio::omni::seed_audio_1p0::api::SeedAudio1p0Request;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

// Seed Audio 1.0 pricing (see https://fal.ai/models/bytedance/seed-audio-1.0):
//   "Your request will cost $0.1875 per minute."
//
// fal bills per minute of GENERATED audio, and no request parameter fixes the
// output duration — it depends on the prompt. The rate is stored in
// hundredths-of-a-cent per minute (exact), and per-duration costs are rounded
// UP to whole cents so the user is never undercharged.

/// $0.1875 per minute, in hundredths of a cent.
pub const SEED_AUDIO_1P0_RATE_HUNDREDTH_CENTS_PER_MINUTE: u64 = 1_875;

/// The duration assumed by the parameterless [`FalRequestCostCalculator`]
/// estimate (the output length isn't knowable at request time).
pub const SEED_AUDIO_1P0_ESTIMATED_DURATION_SECONDS: u64 = 60;

/// Cost in whole cents for a known output duration:
/// ceil(1875 hundredth-cents/min × seconds / 60 / 100).
pub fn seed_audio_1p0_cost_cents_for_duration_seconds(duration_seconds: u64) -> UsdCents {
  (SEED_AUDIO_1P0_RATE_HUNDREDTH_CENTS_PER_MINUTE * duration_seconds).div_ceil(6_000)
}

impl FalRequestCostCalculator for SeedAudio1p0Request {
  /// The output duration isn't known until the audio is generated, so this
  /// estimates one minute of output. Use
  /// [`seed_audio_1p0_cost_cents_for_duration_seconds`] to price the actual
  /// generated duration once it is known.
  fn calculate_cost_in_cents(&self) -> UsdCents {
    seed_audio_1p0_cost_cents_for_duration_seconds(SEED_AUDIO_1P0_ESTIMATED_DURATION_SECONDS)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  mod duration_cost_table {
    use super::*;

    // (duration_seconds, expected_cents)
    // Math: ceil($0.1875/min × seconds), i.e. ceil(18.75¢ × secs / 60).
    const COST_TABLE: &[(u64, u64)] = &[
      (0, 0),
      (1, 1),     // 0.3125 → 1
      (10, 4),    // 3.125 → 4
      (30, 10),   // 9.375 → 10
      (32, 10),   // exactly 10.0
      (60, 19),   // 18.75 → 19
      (61, 20),   // 19.0625 → 20
      (90, 29),   // 28.125 → 29
      (96, 30),   // exactly 30.0
      (120, 38),  // 37.5 → 38
      (300, 94),  // 93.75 → 94
      (600, 188), // 187.5 → 188
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration_seconds, expected) in COST_TABLE {
        let got = seed_audio_1p0_cost_cents_for_duration_seconds(duration_seconds);
        assert_eq!(got, expected, "duration_seconds={duration_seconds}");
      }
    }

    #[test]
    fn cost_scales_with_duration() {
      let c30 = seed_audio_1p0_cost_cents_for_duration_seconds(30);
      let c60 = seed_audio_1p0_cost_cents_for_duration_seconds(60);
      let c120 = seed_audio_1p0_cost_cents_for_duration_seconds(120);
      assert!(c30 < c60);
      assert!(c60 < c120);
    }

    #[test]
    fn exact_minute_multiples_never_round() {
      // 16 minutes = exactly 300¢ ($3.00): 1875 × 960 / 6000 = 300.
      assert_eq!(seed_audio_1p0_cost_cents_for_duration_seconds(960), 300);
    }
  }

  mod request_estimate {
    use super::*;

    fn make_request() -> SeedAudio1p0Request {
      SeedAudio1p0Request {
        prompt: "test".to_string(),
        voice: None,
        audio_urls: None,
        image_url: None,
        output_format: None,
        sample_rate: None,
        speed: None,
        volume: None,
        pitch: None,
      }
    }

    #[test]
    fn estimates_one_minute() {
      // 60s at $0.1875/min = 18.75¢ → rounds up to 19¢.
      assert_eq!(make_request().calculate_cost_in_cents(), 19);
      assert_eq!(
        make_request().calculate_cost_in_cents(),
        seed_audio_1p0_cost_cents_for_duration_seconds(SEED_AUDIO_1P0_ESTIMATED_DURATION_SECONDS),
      );
    }

    #[test]
    fn request_options_do_not_affect_the_estimate() {
      use crate::requests::api::audio::omni::seed_audio_1p0::api::{
        SeedAudio1p0OutputFormat, SeedAudio1p0SampleRate, SeedAudio1p0Voice,
        SeedAudio1p0VoicePreset,
      };

      let mut tuned = make_request();
      tuned.voice = Some(SeedAudio1p0Voice::Preset(SeedAudio1p0VoicePreset::FelixZh));
      tuned.output_format = Some(SeedAudio1p0OutputFormat::Wav);
      tuned.sample_rate = Some(SeedAudio1p0SampleRate::Hz48000);
      tuned.speed = Some(2.0);
      tuned.volume = Some(0.5);
      tuned.pitch = Some(-12);

      assert_eq!(tuned.calculate_cost_in_cents(), make_request().calculate_cost_in_cents());
    }
  }
}
