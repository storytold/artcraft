use crate::requests::api::video::text::kling_1p6_pro_text_to_video::api::{
  Kling1p6ProTextToVideoDuration, Kling1p6ProTextToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling1p6ProTextToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 1.6 Pro text-to-video: $0.098/second
    // (see https://fal.ai/models/fal-ai/kling-video/v1.6/pro/text-to-video).
    //
    // Slightly pricier than the image-to-video variant of the same model
    // (which is $0.095/sec). Rate held in tenths-of-cents and rounded up to
    // whole cents at the end so the user is never undercharged.
    let duration_secs = self.duration
      .unwrap_or(Kling1p6ProTextToVideoDuration::FiveSeconds)
      .to_seconds();
    (98u64 * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::video::text::kling_1p6_pro_text_to_video::api::{
    Kling1p6ProTextToVideoAspectRatio, Kling1p6ProTextToVideoDuration,
  };
  use crate::requests::api::video::image::kling_1p6_pro_image_to_video::api::{
    Kling1p6ProImageToVideoAspectRatio, Kling1p6ProImageToVideoDuration,
    Kling1p6ProImageToVideoRequest,
  };

  fn make_request(
    duration: Option<Kling1p6ProTextToVideoDuration>,
  ) -> Kling1p6ProTextToVideoRequest {
    Kling1p6ProTextToVideoRequest {
      prompt: "test".to_string(),
      negative_prompt: None,
      duration,
      aspect_ratio: Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),
      cfg_scale: None,
    }
  }

  // Pricing: $0.098/sec = 98 tenths-of-cents/sec.
  // Cents per duration = ceil(98 × secs / 10).

  #[test]
  fn five_seconds() {
    // (98 * 5 + 9) / 10 = 49 (round up from 49.0¢)
    assert_eq!(
      make_request(Some(Kling1p6ProTextToVideoDuration::FiveSeconds))
        .calculate_cost_in_cents(),
      49,
    );
  }

  #[test]
  fn ten_seconds() {
    // (98 * 10 + 9) / 10 = 98
    assert_eq!(
      make_request(Some(Kling1p6ProTextToVideoDuration::TenSeconds))
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
    let five = make_request(Some(Kling1p6ProTextToVideoDuration::FiveSeconds))
      .calculate_cost_in_cents();
    let ten = make_request(Some(Kling1p6ProTextToVideoDuration::TenSeconds))
      .calculate_cost_in_cents();
    assert!(five < ten, "five={five}¢ < ten={ten}¢");
  }

  /// Sanity: text-to-video should be slightly more expensive than
  /// image-to-video at every supported duration ($0.098 vs $0.095 per
  /// second). Protects against accidentally swapping the rates.
  #[test]
  fn text_to_video_is_pricier_than_image_to_video_at_each_duration() {
    fn i2v(duration: Kling1p6ProImageToVideoDuration) -> u64 {
      Kling1p6ProImageToVideoRequest {
        prompt: "test".to_string(),
        image_url: "https://example.com/i.png".to_string(),
        end_image_url: None,
        negative_prompt: None,
        duration: Some(duration),
        aspect_ratio: Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
        cfg_scale: None,
      }.calculate_cost_in_cents()
    }
    let pairs = [
      (Kling1p6ProTextToVideoDuration::FiveSeconds, Kling1p6ProImageToVideoDuration::FiveSeconds),
      (Kling1p6ProTextToVideoDuration::TenSeconds,  Kling1p6ProImageToVideoDuration::TenSeconds),
    ];
    for (t, i) in pairs {
      let text = make_request(Some(t)).calculate_cost_in_cents();
      let image = i2v(i);
      assert!(text > image, "text-to-video ({text}¢) must be > image-to-video ({image}¢) at {t:?}");
    }
  }

  /// Exhaustive cost-table tests: every permutation of cost-relevant
  /// configuration for text-to-video. There is no direct legacy
  /// equivalent (the legacy `enqueue_kling_v1p6_pro_image_to_video_webhook`
  /// is image-to-video at a slightly lower rate), so the parity here is
  /// against the canonical $0.098/sec formula. A separate sub-test
  /// cross-references the legacy image-to-video function to confirm the
  /// expected per-duration premium ($0.003/sec rounded).
  mod cost_table {
    use super::*;
    use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
    use crate::requests_old::webhook::video::image::enqueue_kling_v1p6_pro_image_to_video_webhook::{
      Kling1p6ProAspectRatio as LegacyAspectRatio,
      Kling1p6ProDuration as LegacyDuration,
      Kling1p6ProRequest as LegacyRequest,
    };

    fn new_request(
      duration: Option<Kling1p6ProTextToVideoDuration>,
      aspect_ratio: Option<Kling1p6ProTextToVideoAspectRatio>,
    ) -> Kling1p6ProTextToVideoRequest {
      Kling1p6ProTextToVideoRequest {
        prompt: "test".to_string(),
        negative_prompt: None,
        duration,
        aspect_ratio,
        cfg_scale: None,
      }
    }

    // (duration, aspect_ratio, expected_cents)
    //
    // Math: ceil(98 × secs / 10) where 5s → 49¢ and 10s → 98¢.
    // duration=None defaults to 5s.
    // Aspect ratio is irrelevant to cost; iterated only to assert it.
    const COST_TABLE: &[(
      Option<Kling1p6ProTextToVideoDuration>,
      Option<Kling1p6ProTextToVideoAspectRatio>,
      u64,
    )] = &[
      // duration=None → 5s default → 49¢
      (None, None,                                                       49),
      (None, Some(Kling1p6ProTextToVideoAspectRatio::Square),            49),
      (None, Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),     49),
      (None, Some(Kling1p6ProTextToVideoAspectRatio::NineBySixteen),     49),
      // duration=5s → 49¢
      (Some(Kling1p6ProTextToVideoDuration::FiveSeconds), None,                                                       49),
      (Some(Kling1p6ProTextToVideoDuration::FiveSeconds), Some(Kling1p6ProTextToVideoAspectRatio::Square),             49),
      (Some(Kling1p6ProTextToVideoDuration::FiveSeconds), Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),      49),
      (Some(Kling1p6ProTextToVideoDuration::FiveSeconds), Some(Kling1p6ProTextToVideoAspectRatio::NineBySixteen),      49),
      // duration=10s → 98¢
      (Some(Kling1p6ProTextToVideoDuration::TenSeconds),  None,                                                       98),
      (Some(Kling1p6ProTextToVideoDuration::TenSeconds),  Some(Kling1p6ProTextToVideoAspectRatio::Square),             98),
      (Some(Kling1p6ProTextToVideoDuration::TenSeconds),  Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),      98),
      (Some(Kling1p6ProTextToVideoDuration::TenSeconds),  Some(Kling1p6ProTextToVideoAspectRatio::NineBySixteen),      98),
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
        Some(Kling1p6ProTextToVideoAspectRatio::Square),
        Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),
        Some(Kling1p6ProTextToVideoAspectRatio::NineBySixteen),
      ];
      let durations = [
        None,
        Some(Kling1p6ProTextToVideoDuration::FiveSeconds),
        Some(Kling1p6ProTextToVideoDuration::TenSeconds),
      ];
      for duration in durations {
        let baseline = new_request(duration, aspect_ratios[0]).calculate_cost_in_cents();
        for &ar in &aspect_ratios[1..] {
          let cost = new_request(duration, ar).calculate_cost_in_cents();
          assert_eq!(cost, baseline, "duration={duration:?} ar={ar:?}");
        }
      }
    }

    /// Cross-check against the legacy image-to-video function. Text-to-video
    /// is `$0.098/sec` and image-to-video is `$0.095/sec`, so at each
    /// duration the cost difference equals `ceil(0.003 × secs)`:
    ///   5s:  49¢ − 48¢ = 1¢   (≈ $0.015 difference before rounding)
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

      // (text duration, equivalent legacy image duration, expected premium in cents)
      let cases = [
        (Kling1p6ProTextToVideoDuration::FiveSeconds, LegacyDuration::FiveSeconds, 1u64),
        (Kling1p6ProTextToVideoDuration::TenSeconds,  LegacyDuration::TenSeconds,  3u64),
      ];

      for (text_d, legacy_d, expected_premium) in cases {
        let text_cost = new_request(Some(text_d), None).calculate_cost_in_cents();
        let image_cost = legacy_image(legacy_d);
        let premium = text_cost.saturating_sub(image_cost);
        assert_eq!(
          premium, expected_premium,
          "{text_d:?}: text={text_cost}¢ legacy_image={image_cost}¢ premium={premium}¢ (want {expected_premium}¢)",
        );
      }
    }
  }
}
