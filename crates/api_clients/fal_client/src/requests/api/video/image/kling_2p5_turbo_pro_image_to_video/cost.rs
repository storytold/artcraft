use crate::requests::api::video::image::kling_2p5_turbo_pro_image_to_video::api::{
  Kling2p5TurboProImageToVideoDuration, Kling2p5TurboProImageToVideoRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Kling2p5TurboProImageToVideoRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Kling 2.5 Turbo Pro image-to-video pricing
    // (see https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video):
    //   "For 5s video your request will cost $0.35.
    //    For every additional second you will be charged $0.07."
    //
    // That works out to a flat $0.07/second rate, identical to the
    // text-to-video pro variant. Rate is held in tenths-of-cents and
    // rounded up to whole cents so the user is never undercharged.
    let duration_secs = self.duration
      .unwrap_or(Kling2p5TurboProImageToVideoDuration::FiveSeconds)
      .to_seconds();
    (70u64 * duration_secs + 9) / 10
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    duration: Option<Kling2p5TurboProImageToVideoDuration>,
  ) -> Kling2p5TurboProImageToVideoRequest {
    Kling2p5TurboProImageToVideoRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/x.png".to_string(),
      tail_image_url: None,
      duration,
      negative_prompt: None,
      cfg_scale: None,
    }
  }

  // Pricing: flat $0.07/sec = 70 tenths-of-cents/sec.
  // Cents per duration = ceil(70 × secs / 10).

  #[test]
  fn five_seconds() {
    // (70 * 5 + 9) / 10 = 35 — matches fal's "$0.35 for 5s" base rate
    assert_eq!(
      make_request(Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds))
        .calculate_cost_in_cents(),
      35,
    );
  }

  #[test]
  fn ten_seconds() {
    // (70 * 10 + 9) / 10 = 70 — matches "$0.35 + 5×$0.07 = $0.70"
    assert_eq!(
      make_request(Some(Kling2p5TurboProImageToVideoDuration::TenSeconds))
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
    let five = make_request(Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds))
      .calculate_cost_in_cents();
    let ten = make_request(Some(Kling2p5TurboProImageToVideoDuration::TenSeconds))
      .calculate_cost_in_cents();
    assert!(five < ten, "five={five}¢ < ten={ten}¢");
  }

  /// Exhaustive cost-table tests. No legacy *pro* webhook exists for
  /// image-to-video — only the legacy `standard` webhook ships — so this is
  /// parity against the *documented* fal pricing and against the
  /// text-to-video pro rate, which fal sets at the same $0.07/sec.
  mod cost_table {
    use super::*;
    use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

    fn new_request(
      duration: Option<Kling2p5TurboProImageToVideoDuration>,
      tail_image_url: Option<&str>,
    ) -> Kling2p5TurboProImageToVideoRequest {
      Kling2p5TurboProImageToVideoRequest {
        prompt: "test".to_string(),
        image_url: "https://example.com/x.png".to_string(),
        tail_image_url: tail_image_url.map(String::from),
        duration,
        negative_prompt: None,
        cfg_scale: None,
      }
    }

    // (duration, tail_image_url_present, expected_cents)
    //
    // Math: ceil(70 × secs / 10). 5s → 35¢; 10s → 70¢.
    // duration=None defaults to 5s; tail_image_url is irrelevant to cost.
    const COST_TABLE: &[(
      Option<Kling2p5TurboProImageToVideoDuration>,
      bool,
      u64,
    )] = &[
      // duration=None → 5s default → 35¢
      (None,                                                       false, 35),
      (None,                                                       true,  35),
      // duration=5s → 35¢
      (Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds),    false, 35),
      (Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds),    true,  35),
      // duration=10s → 70¢
      (Some(Kling2p5TurboProImageToVideoDuration::TenSeconds),     false, 70),
      (Some(Kling2p5TurboProImageToVideoDuration::TenSeconds),     true,  70),
    ];

    #[test]
    fn matches_cost_table() {
      for &(duration, tail_present, expected) in COST_TABLE {
        let tail = if tail_present { Some("https://example.com/tail.png") } else { None };
        let got = new_request(duration, tail).calculate_cost_in_cents();
        assert_eq!(
          got, expected,
          "duration={duration:?} tail_present={tail_present}",
        );
      }
    }

    /// tail_image_url is not part of the billing formula — every choice
    /// must produce the same value for fixed duration.
    #[test]
    fn cost_is_independent_of_tail_image_url() {
      let durations = [
        None,
        Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds),
        Some(Kling2p5TurboProImageToVideoDuration::TenSeconds),
      ];
      for duration in durations {
        let without = new_request(duration, None).calculate_cost_in_cents();
        let with    = new_request(duration, Some("https://example.com/tail.png"))
          .calculate_cost_in_cents();
        assert_eq!(with, without, "duration={duration:?}");
      }
    }

    /// cfg_scale is not part of the billing formula.
    #[test]
    fn cost_is_independent_of_cfg_scale() {
      for cfg in [None, Some(0.0_f32), Some(0.5), Some(1.0)] {
        let req = Kling2p5TurboProImageToVideoRequest {
          prompt: "test".to_string(),
          image_url: "https://example.com/x.png".to_string(),
          tail_image_url: None,
          duration: Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds),
          negative_prompt: None,
          cfg_scale: cfg,
        };
        assert_eq!(req.calculate_cost_in_cents(), 35, "cfg_scale={cfg:?}");
      }
    }

    /// Image-to-video and text-to-video pro share the same $0.07/sec rate
    /// per fal's docs — costs must match exactly at every duration. If
    /// either rate drifts in the future this test fires.
    #[test]
    fn matches_text_to_video_pro_cost_at_each_duration() {
      use crate::requests::api::video::text::kling_2p5_turbo_pro_text_to_video::api::{
        Kling2p5TurboProTextToVideoAspectRatio, Kling2p5TurboProTextToVideoDuration,
        Kling2p5TurboProTextToVideoRequest,
      };
      fn t2v(duration: Kling2p5TurboProTextToVideoDuration) -> u64 {
        Kling2p5TurboProTextToVideoRequest {
          prompt: "test".to_string(),
          negative_prompt: None,
          duration: Some(duration),
          aspect_ratio: Some(Kling2p5TurboProTextToVideoAspectRatio::SixteenByNine),
          cfg_scale: None,
        }.calculate_cost_in_cents()
      }
      let pairs = [
        (Kling2p5TurboProImageToVideoDuration::FiveSeconds, Kling2p5TurboProTextToVideoDuration::FiveSeconds),
        (Kling2p5TurboProImageToVideoDuration::TenSeconds,  Kling2p5TurboProTextToVideoDuration::TenSeconds),
      ];
      for (i2v_d, t2v_d) in pairs {
        let image_cost = new_request(Some(i2v_d), None).calculate_cost_in_cents();
        let text_cost = t2v(t2v_d);
        assert_eq!(
          image_cost, text_cost,
          "{i2v_d:?} vs {t2v_d:?}: image={image_cost}¢ text={text_cost}¢ — rates should match at $0.07/sec",
        );
      }
    }

    /// Sanity-check fal's documented examples:
    ///   "For 5s video your request will cost $0.35"
    ///   "For every additional second you will be charged $0.07"
    ///   → 10s costs $0.35 + 5 × $0.07 = $0.70
    #[test]
    fn matches_documented_examples() {
      assert_eq!(
        make_request(Some(Kling2p5TurboProImageToVideoDuration::FiveSeconds))
          .calculate_cost_in_cents(),
        35,
      );
      assert_eq!(
        make_request(Some(Kling2p5TurboProImageToVideoDuration::TenSeconds))
          .calculate_cost_in_cents(),
        70,
      );
    }
  }
}
