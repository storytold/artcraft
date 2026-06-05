use crate::requests::api::video::image::kling_2p6_pro_image_to_video::api::{
  Kling2p6ProImageToVideoDuration, Kling2p6ProImageToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling2p6ProImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 2.6 Pro image-to-video pricing
    // (see https://fal.ai/models/fal-ai/kling-video/v2.6/pro/image-to-video):
    //   $0.07/sec  — audio off
    //   $0.14/sec  — audio on, no voice control
    //   $0.168/sec — audio on with voice IDs (voice control)
    //
    // `generate_audio` defaults to `true` on fal's server, so `None` bills as
    // audio-on. Voice control is active when audio is on and `voice_ids`
    // contains at least one entry.
    //
    // Rate is held in tenths-of-cents and rounded up to whole cents so the
    // user is never undercharged.
    let duration_secs = self.duration
      .unwrap_or(Kling2p6ProImageToVideoDuration::FiveSeconds)
      .to_seconds();

    let audio_on = self.generate_audio.unwrap_or(true);
    let has_voice = self.voice_ids.as_ref().is_some_and(|v| !v.is_empty());

    let rate_tenth_cents_per_sec: u64 = match (audio_on, has_voice) {
      (false, _)    => 70,   // $0.07/sec — audio off
      (true,  false) => 140, // $0.14/sec — audio on, no voice control
      (true,  true)  => 168, // $0.168/sec — audio + voice control
    };

    (rate_tenth_cents_per_sec * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    duration: Option<Kling2p6ProImageToVideoDuration>,
    generate_audio: Option<bool>,
    voice_ids: Option<Vec<String>>,
  ) -> Kling2p6ProImageToVideoRequest {
    Kling2p6ProImageToVideoRequest {
      prompt: "test".to_string(),
      start_image_url: "https://example.com/start.png".to_string(),
      end_image_url: None,
      duration,
      negative_prompt: None,
      generate_audio,
      voice_ids,
    }
  }

  // Pricing tiers in tenths-of-cents per second:
  //   audio off                → 70
  //   audio on (no voice)      → 140
  //   audio on + voice control → 168
  // Cents per duration = ceil(rate × secs / 10).

  #[test]
  fn five_seconds_audio_off() {
    // (70 * 5 + 9) / 10 = 35
    assert_eq!(
      make_request(Some(Kling2p6ProImageToVideoDuration::FiveSeconds), Some(false), None)
        .calculate_cost_in_cents(),
      35,
    );
  }

  #[test]
  fn five_seconds_audio_on_no_voice() {
    // (140 * 5 + 9) / 10 = 70 — matches fal's "$0.70 for 5s with audio" example
    assert_eq!(
      make_request(Some(Kling2p6ProImageToVideoDuration::FiveSeconds), Some(true), None)
        .calculate_cost_in_cents(),
      70,
    );
  }

  #[test]
  fn five_seconds_audio_on_with_voice() {
    // (168 * 5 + 9) / 10 = 84
    assert_eq!(
      make_request(
        Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
        Some(true),
        Some(vec!["voice_a".to_string()]),
      )
        .calculate_cost_in_cents(),
      84,
    );
  }

  #[test]
  fn ten_seconds_audio_off() {
    // (70 * 10 + 9) / 10 = 70
    assert_eq!(
      make_request(Some(Kling2p6ProImageToVideoDuration::TenSeconds), Some(false), None)
        .calculate_cost_in_cents(),
      70,
    );
  }

  #[test]
  fn ten_seconds_audio_on_no_voice() {
    // (140 * 10 + 9) / 10 = 140
    assert_eq!(
      make_request(Some(Kling2p6ProImageToVideoDuration::TenSeconds), Some(true), None)
        .calculate_cost_in_cents(),
      140,
    );
  }

  #[test]
  fn ten_seconds_audio_on_with_voice() {
    // (168 * 10 + 9) / 10 = 168 — matches fal's "$1.68 for 10s with audio + voice" example
    assert_eq!(
      make_request(
        Some(Kling2p6ProImageToVideoDuration::TenSeconds),
        Some(true),
        Some(vec!["voice_a".to_string()]),
      )
        .calculate_cost_in_cents(),
      168,
    );
  }

  #[test]
  fn default_duration_is_five_seconds() {
    // duration=None, audio=on (default), no voice → 5s @ $0.14 = 70¢
    assert_eq!(make_request(None, None, None).calculate_cost_in_cents(), 70);
  }

  #[test]
  fn default_audio_is_on() {
    let none_default = make_request(
      Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
      None,
      None,
    ).calculate_cost_in_cents();
    let explicit_on = make_request(
      Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
      Some(true),
      None,
    ).calculate_cost_in_cents();
    assert_eq!(none_default, explicit_on);
  }

  #[test]
  fn empty_voice_ids_does_not_trigger_voice_tier() {
    // `Some(vec![])` is semantically "no voices supplied" — it should bill at
    // the $0.14/sec audio-on rate, not the $0.168/sec voice-control rate.
    let with_empty = make_request(
      Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
      Some(true),
      Some(vec![]),
    ).calculate_cost_in_cents();
    let with_none = make_request(
      Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
      Some(true),
      None,
    ).calculate_cost_in_cents();
    assert_eq!(with_empty, with_none, "empty voice_ids should match None");
    assert_eq!(with_empty, 70);
  }

  #[test]
  fn voice_ids_with_audio_off_does_not_change_cost() {
    // Audio is off → voice control is meaningless. Pricing must stay at the
    // $0.07/sec floor. (fal silently ignores voice_ids if audio is off.)
    let with_voice = make_request(
      Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
      Some(false),
      Some(vec!["voice_a".to_string()]),
    ).calculate_cost_in_cents();
    let without_voice = make_request(
      Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
      Some(false),
      None,
    ).calculate_cost_in_cents();
    assert_eq!(with_voice, without_voice);
    assert_eq!(with_voice, 35);
  }

  #[test]
  fn pricing_tiers_are_strictly_ascending() {
    // At each duration: audio_off < audio_on < audio_on+voice
    for d in [
      Kling2p6ProImageToVideoDuration::FiveSeconds,
      Kling2p6ProImageToVideoDuration::TenSeconds,
    ] {
      let off = make_request(Some(d), Some(false), None).calculate_cost_in_cents();
      let on  = make_request(Some(d), Some(true), None).calculate_cost_in_cents();
      let vc  = make_request(Some(d), Some(true), Some(vec!["v".to_string()]))
        .calculate_cost_in_cents();
      assert!(off < on, "duration={d:?}: audio_off={off}¢ < audio_on={on}¢");
      assert!(on < vc,  "duration={d:?}: audio_on={on}¢ < voice_ctrl={vc}¢");
    }
  }

  /// Exhaustive cost-table tests: every permutation of cost-relevant
  /// configuration (duration × generate_audio × voice_ids presence).
  mod cost_table {
    use super::*;
    use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

    // (duration, generate_audio, voice_ids_present, expected_cents)
    //
    // Tenths-of-cents/sec by tier: off=70, on=140, voice=168.
    // Cents per duration = ceil(rate × secs / 10).
    // duration=None defaults to 5s; generate_audio=None defaults to true.
    const COST_TABLE: &[(
      Option<Kling2p6ProImageToVideoDuration>,
      Option<bool>,
      bool, // voice_ids non-empty
      u64,
    )] = &[
      // duration=None → 5s default
      (None,                                                     Some(false), false, 35),
      (None,                                                     Some(false), true,  35),  // voice ignored when audio off
      (None,                                                     Some(true),  false, 70),
      (None,                                                     Some(true),  true,  84),
      (None,                                                     None,        false, 70),  // audio default = on
      (None,                                                     None,        true,  84),
      // duration=5s
      (Some(Kling2p6ProImageToVideoDuration::FiveSeconds),       Some(false), false, 35),
      (Some(Kling2p6ProImageToVideoDuration::FiveSeconds),       Some(false), true,  35),
      (Some(Kling2p6ProImageToVideoDuration::FiveSeconds),       Some(true),  false, 70),
      (Some(Kling2p6ProImageToVideoDuration::FiveSeconds),       Some(true),  true,  84),
      (Some(Kling2p6ProImageToVideoDuration::FiveSeconds),       None,        false, 70),
      (Some(Kling2p6ProImageToVideoDuration::FiveSeconds),       None,        true,  84),
      // duration=10s
      (Some(Kling2p6ProImageToVideoDuration::TenSeconds),        Some(false), false, 70),
      (Some(Kling2p6ProImageToVideoDuration::TenSeconds),        Some(false), true,  70),
      (Some(Kling2p6ProImageToVideoDuration::TenSeconds),        Some(true),  false, 140),
      (Some(Kling2p6ProImageToVideoDuration::TenSeconds),        Some(true),  true,  168),
      (Some(Kling2p6ProImageToVideoDuration::TenSeconds),        None,        false, 140),
      (Some(Kling2p6ProImageToVideoDuration::TenSeconds),        None,        true,  168),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, generate_audio, voice_present, expected) in COST_TABLE {
        let voice_ids = if voice_present { Some(vec!["voice_a".to_string()]) } else { None };
        let got = make_request(duration, generate_audio, voice_ids).calculate_cost_in_cents();
        assert_eq!(
          got, expected,
          "duration={duration:?} audio={generate_audio:?} voice={voice_present}",
        );
      }
    }

    /// Number of voice IDs (1 vs 2) doesn't affect cost — only the presence
    /// of at least one. Tests 1 and 2 voices (fal's max).
    #[test]
    fn voice_count_does_not_affect_cost() {
      let one = make_request(
        Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
        Some(true),
        Some(vec!["voice_a".to_string()]),
      ).calculate_cost_in_cents();
      let two = make_request(
        Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
        Some(true),
        Some(vec!["voice_a".to_string(), "voice_b".to_string()]),
      ).calculate_cost_in_cents();
      assert_eq!(one, two);
      assert_eq!(one, 84);
    }

    /// end_image_url is not part of the billing formula.
    #[test]
    fn cost_is_independent_of_end_image_url() {
      let with_end = Kling2p6ProImageToVideoRequest {
        end_image_url: Some("https://example.com/end.png".to_string()),
        ..make_request(Some(Kling2p6ProImageToVideoDuration::FiveSeconds), Some(true), None)
      };
      let without_end = make_request(
        Some(Kling2p6ProImageToVideoDuration::FiveSeconds),
        Some(true),
        None,
      );
      assert_eq!(
        with_end.calculate_cost_in_cents(),
        without_end.calculate_cost_in_cents(),
      );
    }

    /// Sanity-check fal's documented examples:
    ///   "a 5-second video with audio costs $0.70"
    ///   "a 10-second video with audio and voice control costs $1.68"
    #[test]
    fn matches_documented_examples() {
      // 5s + audio = $0.70
      assert_eq!(
        make_request(Some(Kling2p6ProImageToVideoDuration::FiveSeconds), Some(true), None)
          .calculate_cost_in_cents(),
        70,
      );
      // 10s + audio + voice = $1.68
      assert_eq!(
        make_request(
          Some(Kling2p6ProImageToVideoDuration::TenSeconds),
          Some(true),
          Some(vec!["voice_a".to_string()]),
        ).calculate_cost_in_cents(),
        168,
      );
    }
  }
}
