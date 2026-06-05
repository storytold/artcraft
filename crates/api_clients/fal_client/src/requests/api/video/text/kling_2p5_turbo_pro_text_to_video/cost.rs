use crate::requests::api::video::text::kling_2p5_turbo_pro_text_to_video::api::{
  Kling2p5TurboProTextToVideoDuration, Kling2p5TurboProTextToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling2p5TurboProTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 2.5 Turbo Pro text-to-video pricing
    // (see https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video):
    //   "For 5s video your request will cost $0.35.
    //    For every additional second you will be charged $0.07."
    //
    // That works out to a flat $0.07/second rate. Rate is held in
    // tenths-of-cents and rounded up to whole cents so the user is never
    // undercharged.
    let duration_secs = self.duration
      .unwrap_or(Kling2p5TurboProTextToVideoDuration::FiveSeconds)
      .to_seconds();
    (70u64 * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::kling_2p5_turbo_pro_text_to_video::api::{
    Kling2p5TurboProTextToVideoAspectRatio, Kling2p5TurboProTextToVideoDuration,
  };

  fn make_request(
    duration: Option<Kling2p5TurboProTextToVideoDuration>,
  ) -> Kling2p5TurboProTextToVideoRequest {
    Kling2p5TurboProTextToVideoRequest {
      prompt: "test".to_string(),
      negative_prompt: None,
      duration,
      aspect_ratio: Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
    }
  }

  // Pricing: flat $0.07/sec = 70 tenths-of-cents/sec.
  // Cents per duration = ceil(70 × secs / 10).

  #[test]
  fn five_seconds() {
    // (70 * 5 + 9) / 10 = 35 — matches fal's "$0.35 for 5s" base rate
    assert_eq!(
      make_request(Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds))
        .calculate_cost_in_cents(),
      35,
    );
  }

  #[test]
  fn ten_seconds() {
    // (70 * 10 + 9) / 10 = 70 — matches "$0.35 + 5×$0.07 = $0.70"
    assert_eq!(
      make_request(Some(Kling2p5TurboProTextToVideoDuration::TenSeconds))
        .calculate_cost_in_cents(),
      70,
    );
  }

  #[test]
  fn default_duration_is_five_seconds() {
    // duration=None → 5s → 35¢
    assert_eq!(make_request(None).calculate_cost_in_cents(), 35);
  }

  #[test]
  fn ten_seconds_costs_more_than_five() {
    let five = make_request(Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds))
      .calculate_cost_in_cents();
    let ten = make_request(Some(Kling2p5TurboProTextToVideoDuration::TenSeconds))
      .calculate_cost_in_cents();
    assert!(five < ten, "five={five}¢ < ten={ten}¢");
  }

  /// Exhaustive cost-table tests and cross-checks against the legacy
  /// `enqueue_kling_v2p5_turbo_pro_text_to_video_webhook` calculator.
  mod legacy_parity {
    use super::*;
    use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
    use crate::requests_old::webhook::video::text::enqueue_kling_v2p5_turbo_pro_text_to_video_webhook::{
      EnqueueKlingV2p5TurboProTextToVideoAspectRatio as LegacyAspectRatio,
      EnqueueKlingV2p5TurboProTextToVideoDurationSeconds as LegacyDuration,
      EnqueueKlingV2p5TurboProTextToVideoRequest as LegacyRequest,
    };

    // ── Mapping helpers from the new strongly-typed API to the legacy one ──

    fn legacy_duration_for(d: Option<Kling2p5TurboProTextToVideoDuration>) -> Option<LegacyDuration> {
      match d {
        None => None,
        Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds) => Some(LegacyDuration::Five),
        Some(Kling2p5TurboProTextToVideoDuration::TenSeconds) => Some(LegacyDuration::Ten),
      }
    }

    fn legacy_aspect_ratio_for(
      ar: Option<Kling2p5TurboProTextToVideoAspectRatio>,
    ) -> Option<LegacyAspectRatio> {
      match ar {
        None => None,
        Some(Kling2p5TurboProTextToVideoAspectRatio::Square) => Some(LegacyAspectRatio::Square),
        Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine) => Some(LegacyAspectRatio::SixteenByNine),
        Some(Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen) => Some(LegacyAspectRatio::NineBySixteen),
      }
    }

    fn new_request(
      duration: Option<Kling2p5TurboProTextToVideoDuration>,
      aspect_ratio: Option<Kling2p5TurboProTextToVideoAspectRatio>,
    ) -> Kling2p5TurboProTextToVideoRequest {
      Kling2p5TurboProTextToVideoRequest {
        prompt: "test".to_string(),
        negative_prompt: None,
        duration,
        aspect_ratio,
        cfg_scale: None,
      }
    }

    fn legacy_request(
      duration: Option<Kling2p5TurboProTextToVideoDuration>,
      aspect_ratio: Option<Kling2p5TurboProTextToVideoAspectRatio>,
    ) -> LegacyRequest {
      LegacyRequest {
        prompt: "test".to_string(),
        negative_prompt: None,
        duration: legacy_duration_for(duration),
        aspect_ratio: legacy_aspect_ratio_for(aspect_ratio),
      }
    }

    // (new_duration, new_aspect_ratio, expected_cents)
    //
    // Math: ceil(70 × secs / 10). 5s → 35¢; 10s → 70¢.
    // duration=None defaults to 5s in both new and legacy modules.
    // Aspect ratio is irrelevant to cost; iterated only to assert it.
    const COST_TABLE: &[(
      Option<Kling2p5TurboProTextToVideoDuration>,
      Option<Kling2p5TurboProTextToVideoAspectRatio>,
      u64,
    )] = &[
      // duration=None → 5s default → 35¢
      (None, None,                                                       35),
      (None, Some(Kling2p5TurboProTextToVideoAspectRatio::Square),           35),
      (None, Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),    35),
      (None, Some(Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen),    35),
      // duration=5s → 35¢
      (Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds), None,                                                       35),
      (Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds), Some(Kling2p5TurboProTextToVideoAspectRatio::Square),           35),
      (Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds), Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),    35),
      (Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds), Some(Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen),    35),
      // duration=10s → 70¢
      (Some(Kling2p5TurboProTextToVideoDuration::TenSeconds),  None,                                                       70),
      (Some(Kling2p5TurboProTextToVideoDuration::TenSeconds),  Some(Kling2p5TurboProTextToVideoAspectRatio::Square),           70),
      (Some(Kling2p5TurboProTextToVideoDuration::TenSeconds),  Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),    70),
      (Some(Kling2p5TurboProTextToVideoDuration::TenSeconds),  Some(Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen),    70),
    ];

    #[test]
    fn new_module_matches_cost_table() {
      for &(duration, aspect_ratio, expected) in COST_TABLE {
        let got = new_request(duration, aspect_ratio).calculate_cost_in_cents();
        assert_eq!(
          got, expected,
          "new module: duration={duration:?} aspect_ratio={aspect_ratio:?}",
        );
      }
    }

    #[test]
    fn legacy_function_matches_cost_table() {
      for &(duration, aspect_ratio, expected) in COST_TABLE {
        let got = legacy_request(duration, aspect_ratio).calculate_cost_in_cents();
        assert_eq!(
          got, expected,
          "legacy function: duration={duration:?} aspect_ratio={aspect_ratio:?}",
        );
      }
    }

    /// Headline parity check: new vs legacy give identical cents at every
    /// permutation. If this fails, pricing has drifted.
    #[test]
    fn new_module_matches_legacy_at_every_combo() {
      for &(duration, aspect_ratio, _) in COST_TABLE {
        let new_cost = new_request(duration, aspect_ratio).calculate_cost_in_cents();
        let legacy_cost = legacy_request(duration, aspect_ratio).calculate_cost_in_cents();
        assert_eq!(
          new_cost, legacy_cost,
          "parity mismatch at duration={duration:?} aspect_ratio={aspect_ratio:?}: \
           new={new_cost}¢ vs legacy={legacy_cost}¢",
        );
      }
    }

    /// Aspect ratio is not part of the billing formula — every aspect-ratio
    /// choice (including `None`) must produce the same value for fixed
    /// duration.
    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let aspect_ratios = [
        None,
        Some(Kling2p5TurboProTextToVideoAspectRatio::Square),
        Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),
        Some(Kling2p5TurboProTextToVideoAspectRatio::NineBySixteen),
      ];
      let durations = [
        None,
        Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds),
        Some(Kling2p5TurboProTextToVideoDuration::TenSeconds),
      ];
      for duration in durations {
        let baseline = new_request(duration, aspect_ratios[0]).calculate_cost_in_cents();
        for &ar in &aspect_ratios[1..] {
          let cost = new_request(duration, ar).calculate_cost_in_cents();
          assert_eq!(cost, baseline, "duration={duration:?} ar={ar:?}");
        }
      }
    }

    /// cfg_scale is not part of the billing formula.
    #[test]
    fn cost_is_independent_of_cfg_scale() {
      for cfg in [None, Some(0.0_f32), Some(0.5), Some(1.0)] {
        let req = Kling2p5TurboProTextToVideoRequest {
          prompt: "test".to_string(),
          negative_prompt: None,
          duration: Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds),
          aspect_ratio: Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),
          cfg_scale: cfg,
        };
        assert_eq!(req.calculate_cost_in_cents(), 35, "cfg_scale={cfg:?}");
      }
    }

    /// Sanity-check fal's documented examples:
    ///   "For 5s video your request will cost $0.35"
    ///   "For every additional second you will be charged $0.07"
    ///   → 10s costs $0.35 + 5 × $0.07 = $0.70
    #[test]
    fn matches_documented_examples() {
      assert_eq!(
        make_request(Some(Kling2p5TurboProTextToVideoDuration::FiveSeconds))
          .calculate_cost_in_cents(),
        35,
        "5s should be $0.35 per fal's docs",
      );
      assert_eq!(
        make_request(Some(Kling2p5TurboProTextToVideoDuration::TenSeconds))
          .calculate_cost_in_cents(),
        70,
        "10s should be $0.70 per fal's docs",
      );
    }
  }
}
