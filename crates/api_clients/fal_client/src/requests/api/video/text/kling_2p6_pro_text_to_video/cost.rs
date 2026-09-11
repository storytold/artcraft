use crate::requests::api::video::text::kling_2p6_pro_text_to_video::api::{
  Kling2p6ProTextToVideoDuration, Kling2p6ProTextToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling2p6ProTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 2.6 Pro text-to-video pricing
    // (see https://fal.ai/models/fal-ai/kling-video/v2.6/pro/text-to-video):
    //   $0.07/sec when audio is off
    //   $0.14/sec when audio is on
    //
    // generate_audio defaults to `true` on fal's server, so `None` is billed
    // as audio-on. Rate stored in tenths-of-cents and rounded up to whole
    // cents so the user is never undercharged.
    let duration_secs = self.duration
      .unwrap_or(Kling2p6ProTextToVideoDuration::FiveSeconds)
      .to_seconds();

    let audio_on = self.generate_audio.unwrap_or(true);
    let rate_tenth_cents_per_sec: u64 = if audio_on { 140 } else { 70 };

    (rate_tenth_cents_per_sec * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::kling_2p6_pro_text_to_video::api::{
    Kling2p6ProTextToVideoAspectRatio, Kling2p6ProTextToVideoDuration,
  };

  fn make_request(
    duration: Option<Kling2p6ProTextToVideoDuration>,
    generate_audio: Option<bool>,
  ) -> Kling2p6ProTextToVideoRequest {
    Kling2p6ProTextToVideoRequest {
      prompt: "test".to_string(),
      generate_audio,
      negative_prompt: None,
      duration,
      aspect_ratio: Some(Kling2p6ProTextToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
    }
  }

  // Pricing: $0.07/sec audio off, $0.14/sec audio on.
  // Cents per duration = ceil(rate × secs / 10) where rate is in tenths-of-cents.

  #[test]
  fn five_seconds_audio_off() {
    // (70 * 5 + 9) / 10 = 35
    assert_eq!(
      make_request(Some(Kling2p6ProTextToVideoDuration::FiveSeconds), Some(false))
        .calculate_cost_in_cents(),
      35,
    );
  }

  #[test]
  fn five_seconds_audio_on() {
    // (140 * 5 + 9) / 10 = 70 — matches fal's $0.70 example
    assert_eq!(
      make_request(Some(Kling2p6ProTextToVideoDuration::FiveSeconds), Some(true))
        .calculate_cost_in_cents(),
      70,
    );
  }

  #[test]
  fn ten_seconds_audio_off() {
    // (70 * 10 + 9) / 10 = 70
    assert_eq!(
      make_request(Some(Kling2p6ProTextToVideoDuration::TenSeconds), Some(false))
        .calculate_cost_in_cents(),
      70,
    );
  }

  #[test]
  fn ten_seconds_audio_on() {
    // (140 * 10 + 9) / 10 = 140
    assert_eq!(
      make_request(Some(Kling2p6ProTextToVideoDuration::TenSeconds), Some(true))
        .calculate_cost_in_cents(),
      140,
    );
  }

  #[test]
  fn default_duration_is_five_seconds() {
    // duration=None, audio=on (default) → 5s @ $0.14 = 70¢
    assert_eq!(make_request(None, None).calculate_cost_in_cents(), 70);
  }

  #[test]
  fn default_audio_is_on() {
    // duration=5s, audio=None → audio_on=true → 70¢
    let none_default = make_request(Some(Kling2p6ProTextToVideoDuration::FiveSeconds), None)
      .calculate_cost_in_cents();
    let explicit_on = make_request(Some(Kling2p6ProTextToVideoDuration::FiveSeconds), Some(true))
      .calculate_cost_in_cents();
    assert_eq!(none_default, explicit_on);
  }

  #[test]
  fn audio_on_costs_twice_as_much_as_off() {
    // $0.14 / $0.07 = 2x at every duration
    let durations = [
      Kling2p6ProTextToVideoDuration::FiveSeconds,
      Kling2p6ProTextToVideoDuration::TenSeconds,
    ];
    for d in durations {
      let off = make_request(Some(d), Some(false)).calculate_cost_in_cents();
      let on  = make_request(Some(d), Some(true)).calculate_cost_in_cents();
      assert_eq!(on, off * 2, "duration={d:?}: audio_on={on}¢ should be 2× audio_off={off}¢");
    }
  }

  #[test]
  fn ten_seconds_costs_more_than_five() {
    // At a given audio setting, 10s > 5s.
    for audio in [Some(false), Some(true), None] {
      let five = make_request(Some(Kling2p6ProTextToVideoDuration::FiveSeconds), audio)
        .calculate_cost_in_cents();
      let ten = make_request(Some(Kling2p6ProTextToVideoDuration::TenSeconds), audio)
        .calculate_cost_in_cents();
      assert!(five < ten, "audio={audio:?}: five={five}¢ < ten={ten}¢");
    }
  }

  /// Exhaustive cost-table tests: every permutation of cost-relevant
  /// configuration (duration × generate_audio). Aspect ratio is in the cross
  /// product as a sanity check — it must not affect the bill.
  mod cost_table {
    use super::*;
    use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

    fn new_request(
      duration: Option<Kling2p6ProTextToVideoDuration>,
      generate_audio: Option<bool>,
      aspect_ratio: Option<Kling2p6ProTextToVideoAspectRatio>,
    ) -> Kling2p6ProTextToVideoRequest {
      Kling2p6ProTextToVideoRequest {
        prompt: "test".to_string(),
        generate_audio,
        negative_prompt: None,
        duration,
        aspect_ratio,
        cfg_scale: None,
      }
    }

    // (duration, generate_audio, expected_cents)
    //
    // Math: ceil(rate × secs / 10) where rate is 70 (audio off) or 140 (audio on).
    // duration=None defaults to 5s; generate_audio=None defaults to true.
    const COST_TABLE: &[(
      Option<Kling2p6ProTextToVideoDuration>,
      Option<bool>,
      u64,
    )] = &[
      // duration=None → 5s default
      (None,                                                   Some(false), 35),
      (None,                                                   Some(true),  70),
      (None,                                                   None,        70),  // audio default = on
      // duration=5s
      (Some(Kling2p6ProTextToVideoDuration::FiveSeconds),      Some(false), 35),
      (Some(Kling2p6ProTextToVideoDuration::FiveSeconds),      Some(true),  70),
      (Some(Kling2p6ProTextToVideoDuration::FiveSeconds),      None,        70),
      // duration=10s
      (Some(Kling2p6ProTextToVideoDuration::TenSeconds),       Some(false), 70),
      (Some(Kling2p6ProTextToVideoDuration::TenSeconds),       Some(true),  140),
      (Some(Kling2p6ProTextToVideoDuration::TenSeconds),       None,        140),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, generate_audio, expected) in COST_TABLE {
        let got = new_request(duration, generate_audio, None).calculate_cost_in_cents();
        assert_eq!(
          got, expected,
          "duration={duration:?} generate_audio={generate_audio:?}",
        );
      }
    }

    /// Aspect ratio is not part of the billing formula — every aspect-ratio
    /// choice (including `None`) must produce the same value for fixed
    /// (duration, generate_audio).
    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let aspect_ratios = [
        None,
        Some(Kling2p6ProTextToVideoAspectRatio::Square),
        Some(Kling2p6ProTextToVideoAspectRatio::SixteenByNine),
        Some(Kling2p6ProTextToVideoAspectRatio::NineBySixteen),
      ];
      let durations = [
        None,
        Some(Kling2p6ProTextToVideoDuration::FiveSeconds),
        Some(Kling2p6ProTextToVideoDuration::TenSeconds),
      ];
      let audio_options = [None, Some(false), Some(true)];

      for duration in durations {
        for audio in audio_options {
          let baseline = new_request(duration, audio, aspect_ratios[0]).calculate_cost_in_cents();
          for &ar in &aspect_ratios[1..] {
            let cost = new_request(duration, audio, ar).calculate_cost_in_cents();
            assert_eq!(
              cost, baseline,
              "duration={duration:?} audio={audio:?} ar={ar:?}: cost={cost}¢ != baseline={baseline}¢",
            );
          }
        }
      }
    }

    /// cfg_scale is not part of the billing formula — every choice must produce
    /// the same value for fixed (duration, generate_audio).
    #[test]
    fn cost_is_independent_of_cfg_scale() {
      for cfg in [None, Some(0.0_f32), Some(0.5), Some(1.0)] {
        let req = Kling2p6ProTextToVideoRequest {
          prompt: "test".to_string(),
          generate_audio: Some(true),
          negative_prompt: None,
          duration: Some(Kling2p6ProTextToVideoDuration::FiveSeconds),
          aspect_ratio: Some(Kling2p6ProTextToVideoAspectRatio::SixteenByNine),
          cfg_scale: cfg,
        };
        assert_eq!(req.calculate_cost_in_cents(), 70, "cfg_scale={cfg:?}");
      }
    }

    /// Sanity-check the documented examples from fal:
    ///   "a 5s video with audio on will cost $0.70"
    #[test]
    fn matches_documented_examples() {
      let cost = make_request(Some(Kling2p6ProTextToVideoDuration::FiveSeconds), Some(true))
        .calculate_cost_in_cents();
      assert_eq!(cost, 70, "5s audio-on should be $0.70 per fal's docs");
    }
  }
}
