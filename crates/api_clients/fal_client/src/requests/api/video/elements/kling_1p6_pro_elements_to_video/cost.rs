use crate::requests::api::video::elements::kling_1p6_pro_elements_to_video::api::{
  Kling1p6ProElementsToVideoDuration, Kling1p6ProElementsToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling1p6ProElementsToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 1.6 Pro elements-to-video: $0.098/second
    // (see https://fal.ai/models/fal-ai/kling-video/v1.6/pro/elements).
    //
    // Same per-second rate as the v1.6 Pro text-to-video variant. Rate held
    // in tenths-of-cents and rounded up to whole cents at the end so the
    // user is never undercharged.
    let duration_secs = self.duration
      .unwrap_or(Kling1p6ProElementsToVideoDuration::FiveSeconds)
      .to_seconds();
    (98u64 * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::elements::kling_1p6_pro_elements_to_video::api::{
    Kling1p6ProElementsToVideoAspectRatio, Kling1p6ProElementsToVideoDuration,
  };

  fn make_request(
    duration: Option<Kling1p6ProElementsToVideoDuration>,
  ) -> Kling1p6ProElementsToVideoRequest {
    Kling1p6ProElementsToVideoRequest {
      prompt: "test".to_string(),
      input_image_urls: vec!["https://example.com/a.png".to_string()],
      negative_prompt: None,
      duration,
      aspect_ratio: Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),
    }
  }

  // Pricing: $0.098/sec = 98 tenths-of-cents/sec.
  // Cents per duration = ceil(98 × secs / 10).

  #[test]
  fn five_seconds() {
    // (98 * 5 + 9) / 10 = 49
    assert_eq!(
      make_request(Some(Kling1p6ProElementsToVideoDuration::FiveSeconds))
        .calculate_cost_in_cents(),
      49,
    );
  }

  #[test]
  fn ten_seconds() {
    // (98 * 10 + 9) / 10 = 98
    assert_eq!(
      make_request(Some(Kling1p6ProElementsToVideoDuration::TenSeconds))
        .calculate_cost_in_cents(),
      98,
    );
  }

  #[test]
  fn default_duration_is_five_seconds() {
    // duration=None → 5s → 49¢
    assert_eq!(make_request(None).calculate_cost_in_cents(), 49);
  }

  #[test]
  fn ten_seconds_costs_more_than_five() {
    let five = make_request(Some(Kling1p6ProElementsToVideoDuration::FiveSeconds))
      .calculate_cost_in_cents();
    let ten = make_request(Some(Kling1p6ProElementsToVideoDuration::TenSeconds))
      .calculate_cost_in_cents();
    assert!(five < ten, "five={five}¢ < ten={ten}¢");
  }

  #[test]
  fn input_image_count_does_not_affect_cost() {
    // fal bills per second of output, not per input image. Build matched
    // pairs differing only in input_image_urls length and confirm cost
    // matches exactly.
    let base = Kling1p6ProElementsToVideoRequest {
      prompt: "p".to_string(),
      input_image_urls: vec!["https://example.com/a.png".to_string()],
      negative_prompt: None,
      duration: Some(Kling1p6ProElementsToVideoDuration::FiveSeconds),
      aspect_ratio: Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),
    };
    let baseline_cost = base.calculate_cost_in_cents();
    for n in 1..=4usize {
      let urls: Vec<String> = (0..n).map(|i| format!("https://example.com/{i}.png")).collect();
      let req = Kling1p6ProElementsToVideoRequest { input_image_urls: urls, ..base.clone() };
      assert_eq!(
        req.calculate_cost_in_cents(),
        baseline_cost,
        "image count {n} should not change cost",
      );
    }
  }

  /// Exhaustive cost-table tests: every permutation of cost-relevant
  /// configuration for elements-to-video. There is no direct legacy
  /// equivalent (the legacy `enqueue_kling_v1p6_pro_image_to_video_webhook`
  /// is image-to-video at a slightly lower rate), so the parity here is
  /// against the canonical $0.098/sec formula. A separate sub-test
  /// cross-references the legacy image-to-video function to confirm the
  /// expected per-duration premium ($0.003/sec).
  mod cost_table {
    use super::*;
    use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
    use crate::requests_old::webhook::video::image::enqueue_kling_v1p6_pro_image_to_video_webhook::{
      Kling1p6ProAspectRatio as LegacyAspectRatio,
      Kling1p6ProDuration as LegacyDuration,
      Kling1p6ProRequest as LegacyRequest,
    };

    fn new_request(
      duration: Option<Kling1p6ProElementsToVideoDuration>,
      aspect_ratio: Option<Kling1p6ProElementsToVideoAspectRatio>,
    ) -> Kling1p6ProElementsToVideoRequest {
      Kling1p6ProElementsToVideoRequest {
        prompt: "test".to_string(),
        input_image_urls: vec!["https://example.com/a.png".to_string()],
        negative_prompt: None,
        duration,
        aspect_ratio,
      }
    }

    // (duration, aspect_ratio, expected_cents)
    //
    // Math: ceil(98 × secs / 10) where 5s → 49¢ and 10s → 98¢.
    // duration=None defaults to 5s.
    // Aspect ratio is irrelevant to cost; iterated only to assert it.
    const COST_TABLE: &[(
      Option<Kling1p6ProElementsToVideoDuration>,
      Option<Kling1p6ProElementsToVideoAspectRatio>,
      u64,
    )] = &[
      // duration=None → 5s default → 49¢
      (None, None,                                                            49),
      (None, Some(Kling1p6ProElementsToVideoAspectRatio::Square),             49),
      (None, Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),      49),
      (None, Some(Kling1p6ProElementsToVideoAspectRatio::NineBySixteen),      49),
      // duration=5s → 49¢
      (Some(Kling1p6ProElementsToVideoDuration::FiveSeconds), None,                                                       49),
      (Some(Kling1p6ProElementsToVideoDuration::FiveSeconds), Some(Kling1p6ProElementsToVideoAspectRatio::Square),         49),
      (Some(Kling1p6ProElementsToVideoDuration::FiveSeconds), Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),  49),
      (Some(Kling1p6ProElementsToVideoDuration::FiveSeconds), Some(Kling1p6ProElementsToVideoAspectRatio::NineBySixteen),  49),
      // duration=10s → 98¢
      (Some(Kling1p6ProElementsToVideoDuration::TenSeconds),  None,                                                       98),
      (Some(Kling1p6ProElementsToVideoDuration::TenSeconds),  Some(Kling1p6ProElementsToVideoAspectRatio::Square),         98),
      (Some(Kling1p6ProElementsToVideoDuration::TenSeconds),  Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),  98),
      (Some(Kling1p6ProElementsToVideoDuration::TenSeconds),  Some(Kling1p6ProElementsToVideoAspectRatio::NineBySixteen),  98),
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

    /// Aspect ratio is not part of the billing formula — every row in the
    /// cost table must produce the same value for any aspect-ratio choice.
    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let aspect_ratios = [
        None,
        Some(Kling1p6ProElementsToVideoAspectRatio::Square),
        Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),
        Some(Kling1p6ProElementsToVideoAspectRatio::NineBySixteen),
      ];
      let durations = [
        None,
        Some(Kling1p6ProElementsToVideoDuration::FiveSeconds),
        Some(Kling1p6ProElementsToVideoDuration::TenSeconds),
      ];
      for duration in durations {
        let baseline = new_request(duration, aspect_ratios[0]).calculate_cost_in_cents();
        for &ar in &aspect_ratios[1..] {
          let cost = new_request(duration, ar).calculate_cost_in_cents();
          assert_eq!(cost, baseline, "duration={duration:?} ar={ar:?}");
        }
      }
    }

    /// Cross-check against the legacy image-to-video function. Elements-to-video
    /// is `$0.098/sec` and the legacy image-to-video is `$0.095/sec`, so at
    /// each duration the cost difference equals `ceil(0.003 × secs)`:
    ///   5s:  49¢ − 48¢ = 1¢
    ///   10s: 98¢ − 95¢ = 3¢
    /// If a future change to the legacy image-to-video rate breaks this
    /// invariant, this test calls it out.
    #[test]
    fn premium_over_legacy_image_to_video_is_as_expected() {
      fn legacy_image(secs_variant: LegacyDuration) -> u64 {
        LegacyRequest {
          image_url: "https://example.com/i.png".to_string(),
          end_frame_image_url: None,
          prompt: "test".to_string(),
          duration: secs_variant,
          aspect_ratio: LegacyAspectRatio::WideSixteenNine,
        }.calculate_cost_in_cents()
      }

      // (elements duration, equivalent legacy image duration, expected premium in cents)
      let cases = [
        (Kling1p6ProElementsToVideoDuration::FiveSeconds, LegacyDuration::FiveSeconds, 1u64),
        (Kling1p6ProElementsToVideoDuration::TenSeconds,  LegacyDuration::TenSeconds,  3u64),
      ];

      for (elements_d, legacy_d, expected_premium) in cases {
        let elements_cost = new_request(Some(elements_d), None).calculate_cost_in_cents();
        let image_cost = legacy_image(legacy_d);
        let premium = elements_cost.saturating_sub(image_cost);
        assert_eq!(
          premium, expected_premium,
          "{elements_d:?}: elements={elements_cost}¢ legacy_image={image_cost}¢ premium={premium}¢ (want {expected_premium}¢)",
        );
      }
    }

    /// Elements and text-to-video share the same $0.098/sec rate — cells
    /// should match exactly at every duration. Documents the rate-equality
    /// expectation, so if either rate drifts in the future this test fires.
    #[test]
    fn matches_text_to_video_cost_at_each_duration() {
      use crate::requests::api::video::text::kling_1p6_pro_text_to_video::api::{
        Kling1p6ProTextToVideoAspectRatio, Kling1p6ProTextToVideoDuration,
        Kling1p6ProTextToVideoRequest,
      };
      fn t2v(duration: Kling1p6ProTextToVideoDuration) -> u64 {
        Kling1p6ProTextToVideoRequest {
          prompt: "test".to_string(),
          negative_prompt: None,
          duration: Some(duration),
          aspect_ratio: Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),
          cfg_scale: None,
        }.calculate_cost_in_cents()
      }
      let pairs = [
        (Kling1p6ProElementsToVideoDuration::FiveSeconds, Kling1p6ProTextToVideoDuration::FiveSeconds),
        (Kling1p6ProElementsToVideoDuration::TenSeconds,  Kling1p6ProTextToVideoDuration::TenSeconds),
      ];
      for (e_d, t_d) in pairs {
        let elements_cost = new_request(Some(e_d), None).calculate_cost_in_cents();
        let text_cost = t2v(t_d);
        assert_eq!(
          elements_cost, text_cost,
          "{e_d:?} vs {t_d:?}: elements={elements_cost}¢ text={text_cost}¢ — rates should match at $0.098/sec",
        );
      }
    }
  }
}
