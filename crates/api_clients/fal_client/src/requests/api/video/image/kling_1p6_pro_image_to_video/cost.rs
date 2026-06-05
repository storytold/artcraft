use crate::requests::api::video::image::kling_1p6_pro_image_to_video::api::{
  Kling1p6ProImageToVideoDuration, Kling1p6ProImageToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling1p6ProImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 1.6 Pro image-to-video: $0.095/second.
    //
    // Rate is 95 tenths-of-cents per second; round up to whole cents at the
    // end so the user is never undercharged.
    let duration_secs = self.duration
      .unwrap_or(Kling1p6ProImageToVideoDuration::FiveSeconds)
      .to_seconds();
    (95u64 * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::image::kling_1p6_pro_image_to_video::api::{
    Kling1p6ProImageToVideoAspectRatio, Kling1p6ProImageToVideoDuration,
  };

  fn make_request(
    duration: Option<Kling1p6ProImageToVideoDuration>,
  ) -> Kling1p6ProImageToVideoRequest {
    Kling1p6ProImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/image.jpg".to_string(),
      end_image_url: None,
      negative_prompt: None,
      duration,
      aspect_ratio: Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
    }
  }

  // Pricing: $0.095/sec = 95 tenths-of-cents/sec.
  // Cents per duration = ceil(95 × secs / 10).

  #[test]
  fn five_seconds() {
    // (95 * 5 + 9) / 10 = 48 (round up from 47.5¢)
    assert_eq!(
      make_request(Some(Kling1p6ProImageToVideoDuration::FiveSeconds))
        .calculate_cost_in_cents(),
      48,
    );
  }

  #[test]
  fn ten_seconds() {
    // (95 * 10 + 9) / 10 = 95
    assert_eq!(
      make_request(Some(Kling1p6ProImageToVideoDuration::TenSeconds))
        .calculate_cost_in_cents(),
      95,
    );
  }

  #[test]
  fn default_duration_is_five_seconds() {
    // duration=None → 5s → 48¢
    assert_eq!(make_request(None).calculate_cost_in_cents(), 48);
  }

  #[test]
  fn ten_seconds_costs_more_than_five() {
    let five = make_request(Some(Kling1p6ProImageToVideoDuration::FiveSeconds))
      .calculate_cost_in_cents();
    let ten = make_request(Some(Kling1p6ProImageToVideoDuration::TenSeconds))
      .calculate_cost_in_cents();
    assert!(five < ten, "five={five}¢ < ten={ten}¢");
  }

  /// Exhaustive cost-table tests: every permutation of cost-relevant
  /// configuration, asserted both against the legacy
  /// `enqueue_kling_v1p6_pro_image_to_video_webhook` cost function and
  /// against the canonical $0.095/sec rate (`(95 * secs + 9) / 10`).
  ///
  /// Aspect ratio is included in the cross product as a sanity check —
  /// neither the new nor legacy implementation reads it for billing, so
  /// every cell in a given row must agree.
  mod legacy_parity {
    use super::*;
    use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
    use crate::requests_old::webhook::video::image::enqueue_kling_v1p6_pro_image_to_video_webhook::{
      Kling1p6ProAspectRatio as LegacyAspectRatio,
      Kling1p6ProDuration as LegacyDuration,
      Kling1p6ProRequest as LegacyRequest,
    };

    // ── Mapping helpers from the new strongly-typed API to the legacy one ──

    fn legacy_duration_for(d: Option<Kling1p6ProImageToVideoDuration>) -> LegacyDuration {
      match d {
        // The legacy `Default` variant means "5 seconds" semantically — same
        // as the new module's `None` default.
        None => LegacyDuration::Default,
        Some(Kling1p6ProImageToVideoDuration::FiveSeconds) => LegacyDuration::FiveSeconds,
        Some(Kling1p6ProImageToVideoDuration::TenSeconds) => LegacyDuration::TenSeconds,
      }
    }

    fn legacy_aspect_ratio_for(ar: Option<Kling1p6ProImageToVideoAspectRatio>) -> LegacyAspectRatio {
      // The legacy API has no "None" — pick 16:9 as the default when the
      // new request leaves it unset, mirroring fal's documented server
      // default.
      match ar {
        None | Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine) => LegacyAspectRatio::WideSixteenNine,
        Some(Kling1p6ProImageToVideoAspectRatio::Square) => LegacyAspectRatio::Square,
        Some(Kling1p6ProImageToVideoAspectRatio::NineBySixteen) => LegacyAspectRatio::TallNineSixteen,
      }
    }

    fn new_request(
      duration: Option<Kling1p6ProImageToVideoDuration>,
      aspect_ratio: Option<Kling1p6ProImageToVideoAspectRatio>,
    ) -> Kling1p6ProImageToVideoRequest {
      Kling1p6ProImageToVideoRequest {
        prompt: "test".to_string(),
        image_url: "https://example.com/image.jpg".to_string(),
        end_image_url: None,
        negative_prompt: None,
        duration,
        aspect_ratio,
        cfg_scale: None,
      }
    }

    fn legacy_request(
      duration: Option<Kling1p6ProImageToVideoDuration>,
      aspect_ratio: Option<Kling1p6ProImageToVideoAspectRatio>,
    ) -> LegacyRequest {
      LegacyRequest {
        image_url: "https://example.com/image.jpg".to_string(),
        end_frame_image_url: None,
        prompt: "test".to_string(),
        duration: legacy_duration_for(duration),
        aspect_ratio: legacy_aspect_ratio_for(aspect_ratio),
      }
    }

    // (new_duration, new_aspect_ratio, expected_cents)
    //
    // Math:  ceil(95 × secs / 10) where 5s → 48¢ and 10s → 95¢.
    // duration=None defaults to 5s in both the new and legacy modules.
    // Aspect ratio is irrelevant to cost; iterated only to assert it.
    const COST_TABLE: &[(
      Option<Kling1p6ProImageToVideoDuration>,
      Option<Kling1p6ProImageToVideoAspectRatio>,
      u64,
    )] = &[
      // duration=None → 5s default → 48¢
      (None, None,                                                       48),
      (None, Some(Kling1p6ProImageToVideoAspectRatio::Square),           48),
      (None, Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),    48),
      (None, Some(Kling1p6ProImageToVideoAspectRatio::NineBySixteen),    48),
      // duration=5s → 48¢
      (Some(Kling1p6ProImageToVideoDuration::FiveSeconds), None,                                                       48),
      (Some(Kling1p6ProImageToVideoDuration::FiveSeconds), Some(Kling1p6ProImageToVideoAspectRatio::Square),           48),
      (Some(Kling1p6ProImageToVideoDuration::FiveSeconds), Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),    48),
      (Some(Kling1p6ProImageToVideoDuration::FiveSeconds), Some(Kling1p6ProImageToVideoAspectRatio::NineBySixteen),    48),
      // duration=10s → 95¢
      (Some(Kling1p6ProImageToVideoDuration::TenSeconds),  None,                                                       95),
      (Some(Kling1p6ProImageToVideoDuration::TenSeconds),  Some(Kling1p6ProImageToVideoAspectRatio::Square),           95),
      (Some(Kling1p6ProImageToVideoDuration::TenSeconds),  Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),    95),
      (Some(Kling1p6ProImageToVideoDuration::TenSeconds),  Some(Kling1p6ProImageToVideoAspectRatio::NineBySixteen),    95),
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

    /// The headline parity check: at every permutation of the legacy's
    /// cost-relevant configuration, the new and legacy
    /// `calculate_cost_in_cents` return the same value. If this fails, the
    /// new module's pricing has drifted from what shipped previously.
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

    /// Aspect ratio is not part of the billing formula — every row in the
    /// cost table must produce the same value for any aspect-ratio choice.
    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let aspect_ratios = [
        None,
        Some(Kling1p6ProImageToVideoAspectRatio::Square),
        Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
        Some(Kling1p6ProImageToVideoAspectRatio::NineBySixteen),
      ];
      let durations = [
        None,
        Some(Kling1p6ProImageToVideoDuration::FiveSeconds),
        Some(Kling1p6ProImageToVideoDuration::TenSeconds),
      ];
      for duration in durations {
        let baseline = new_request(duration, aspect_ratios[0]).calculate_cost_in_cents();
        for &ar in &aspect_ratios[1..] {
          let cost = new_request(duration, ar).calculate_cost_in_cents();
          assert_eq!(cost, baseline, "duration={duration:?} ar={ar:?}");
        }
      }
    }
  }
}
