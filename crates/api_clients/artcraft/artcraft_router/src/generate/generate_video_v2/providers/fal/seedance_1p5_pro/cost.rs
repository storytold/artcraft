use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  EnqueueSeedance1p5ProTextToVideoDuration, EnqueueSeedance1p5ProTextToVideoRequest,
  EnqueueSeedance1p5ProTextToVideoResolution,
};
use fal_client::requests::webhook::video::image::enqueue_seedance_1p5_pro_image_to_video_webhook::{
  EnqueueSeedance1p5ProImageToVideoDuration, EnqueueSeedance1p5ProImageToVideoResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::fal::seedance_1p5_pro::request::{
  FalSeedance1p5ProMode, FalSeedance1p5ProRequestState,
};

pub struct FalSeedance1p5ProCostState {
  request: FalSeedance1p5ProRequestState,
}

impl FalSeedance1p5ProCostState {
  pub fn from_request(request: &FalSeedance1p5ProRequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Seedance 1.5 Pro t2v and i2v have identical pricing. v1 delegates both
    // to the t2v calculator; v2 does the same to guarantee billing parity.
    let t2v_request = match &self.request.mode {
      FalSeedance1p5ProMode::TextToVideo(req) => req.clone(),
      FalSeedance1p5ProMode::ImageToVideo(req) => EnqueueSeedance1p5ProTextToVideoRequest {
        prompt: String::new(),
        resolution: req.resolution.map(i2v_to_t2v_resolution),
        duration: req.duration.map(i2v_to_t2v_duration),
        aspect_ratio: None,
        generate_audio: req.generate_audio,
      },
    };

    let cost_in_usd_cents = t2v_request.calculate_cost_in_cents();

    VideoGenerationCostEstimate {
      cost_in_credits: Some(cost_in_usd_cents),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

fn i2v_to_t2v_resolution(r: EnqueueSeedance1p5ProImageToVideoResolution) -> EnqueueSeedance1p5ProTextToVideoResolution {
  use EnqueueSeedance1p5ProImageToVideoResolution as I;
  use EnqueueSeedance1p5ProTextToVideoResolution as T;
  match r {
    I::FourEightyP => T::FourEightyP,
    I::SevenTwentyP => T::SevenTwentyP,
    I::TenEightyP => T::TenEightyP,
  }
}

fn i2v_to_t2v_duration(d: EnqueueSeedance1p5ProImageToVideoDuration) -> EnqueueSeedance1p5ProTextToVideoDuration {
  use EnqueueSeedance1p5ProImageToVideoDuration as I;
  use EnqueueSeedance1p5ProTextToVideoDuration as T;
  match d {
    I::FourSeconds => T::FourSeconds,
    I::FiveSeconds => T::FiveSeconds,
    I::SixSeconds => T::SixSeconds,
    I::SevenSeconds => T::SevenSeconds,
    I::EightSeconds => T::EightSeconds,
    I::NineSeconds => T::NineSeconds,
    I::TenSeconds => T::TenSeconds,
    I::ElevenSeconds => T::ElevenSeconds,
    I::TwelveSeconds => T::TwelveSeconds,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  // ── Helpers ──

  fn t2v_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance1p5Pro,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  fn i2v_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance1p5Pro,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      start_frame: Some(ImageRef::Url("https://example.com/start.png".to_string())),
      ..Default::default()
    }
  }

  fn cost_cents(
    builder_factory: fn() -> GenerateVideoRequestBuilder,
    resolution: Option<CommonResolution>,
    duration_seconds: Option<u16>,
    generate_audio: Option<bool>,
  ) -> u64 {
    let mut b = builder_factory();
    b.resolution = resolution;
    b.duration_seconds = duration_seconds;
    b.generate_audio = generate_audio;
    b.build2()
      .expect("build2")
      .estimate_cost()
      .expect("estimate_cost")
      .cost_in_usd_cents
      .expect("cost_in_usd_cents")
  }

  // ── T2V numeric literal pricing assertions ──

  mod t2v_pricing_720p {
    use super::*;

    #[test]
    fn p720_5s_audio_special_case() {
      // Special-case: 720p + 5s + audio short-circuits to 26¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::SevenTwentyP), Some(5), Some(true)), 26);
    }

    #[test]
    fn p720_5s_no_audio_special_case() {
      // Special-case: 720p + 5s without audio → 13¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::SevenTwentyP), Some(5), Some(false)), 13);
    }

    #[test]
    fn p720_5s_default_audio_is_with_audio() {
      // generate_audio = None defaults to true in the cost calculator.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::SevenTwentyP), Some(5), None), 26);
    }

    #[test]
    fn p720_10s_with_audio() {
      // 1280×720×30×10/1024 = 270000 × $2.4/M = $0.648 → ceil = 65¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::SevenTwentyP), Some(10), Some(true)), 65);
    }

    #[test]
    fn p720_10s_no_audio() {
      // 270000 × $1.2/M = $0.324 → ceil = 33¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::SevenTwentyP), Some(10), Some(false)), 33);
    }

    #[test]
    fn p720_12s_with_audio() {
      // 1280×720×30×12/1024 = 324000 × $2.4/M = $0.7776 → ceil = 78¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::SevenTwentyP), Some(12), Some(true)), 78);
    }
  }

  mod t2v_pricing_480p {
    use super::*;

    #[test]
    fn p480_5s_audio() {
      // 640×480×30×5/1024 = 45000 × $2.4/M = $0.108 → ceil = 11¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::FourEightyP), Some(5), Some(true)), 11);
    }

    #[test]
    fn p480_5s_no_audio() {
      // 45000 × $1.2/M = $0.054 → ceil = 6¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::FourEightyP), Some(5), Some(false)), 6);
    }

    #[test]
    fn p480_10s_audio() {
      // 90000 × $2.4/M = $0.216 → ceil = 22¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::FourEightyP), Some(10), Some(true)), 22);
    }
  }

  mod t2v_pricing_1080p {
    use super::*;

    #[test]
    fn p1080_5s_audio() {
      // 1920×1080×30×5/1024 = 303750 × $2.4/M = $0.729 → ceil = 73¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(5), Some(true)), 73);
    }

    #[test]
    fn p1080_5s_no_audio() {
      // 303750 × $1.2/M = $0.36450 → ceil = 37¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(5), Some(false)), 37);
    }

    #[test]
    fn p1080_10s_audio() {
      // 607500 × $2.4/M = $1.458 → ceil = 146¢.
      assert_eq!(cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(10), Some(true)), 146);
    }
  }

  // ── I2V costs match T2V at identical params ──

  mod i2v_matches_t2v {
    use super::*;

    #[test]
    fn p720_5s_audio() {
      assert_eq!(
        cost_cents(i2v_builder, Some(CommonResolution::SevenTwentyP), Some(5), Some(true)),
        cost_cents(t2v_builder, Some(CommonResolution::SevenTwentyP), Some(5), Some(true)),
      );
    }

    #[test]
    fn p1080_10s_no_audio() {
      assert_eq!(
        cost_cents(i2v_builder, Some(CommonResolution::TenEightyP), Some(10), Some(false)),
        cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(10), Some(false)),
      );
    }

    #[test]
    fn p480_12s_audio() {
      assert_eq!(
        cost_cents(i2v_builder, Some(CommonResolution::FourEightyP), Some(12), Some(true)),
        cost_cents(t2v_builder, Some(CommonResolution::FourEightyP), Some(12), Some(true)),
      );
    }
  }

  // ── Relative pricing invariants ──

  mod relative_pricing {
    use super::*;

    #[test]
    fn higher_resolution_costs_more() {
      let p480 = cost_cents(t2v_builder, Some(CommonResolution::FourEightyP), Some(5), Some(true));
      let p720 = cost_cents(t2v_builder, Some(CommonResolution::SevenTwentyP), Some(5), Some(true));
      let p1080 = cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(5), Some(true));
      assert!(p480 < p720, "480p ({p480}) < 720p ({p720})");
      assert!(p720 < p1080, "720p ({p720}) < 1080p ({p1080})");
    }

    #[test]
    fn longer_duration_costs_more() {
      let d4 = cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(4), Some(true));
      let d8 = cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(8), Some(true));
      let d12 = cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(12), Some(true));
      assert!(d4 < d8);
      assert!(d8 < d12);
    }

    #[test]
    fn audio_costs_more_than_no_audio() {
      let with_audio = cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(10), Some(true));
      let no_audio = cost_cents(t2v_builder, Some(CommonResolution::TenEightyP), Some(10), Some(false));
      assert!(no_audio < with_audio, "no-audio ({no_audio}) < audio ({with_audio})");
    }
  }

  // ── Aspect ratio doesn't affect cost ──

  #[test]
  fn aspect_ratio_does_not_affect_cost() {
    let mut b = t2v_builder();
    b.resolution = Some(CommonResolution::SevenTwentyP);
    b.duration_seconds = Some(10);
    b.generate_audio = Some(true);
    let baseline = b.clone().build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap();

    for ar in [
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::Square),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::TallNineBySixteen),
      Some(CommonAspectRatio::WideTwentyOneByNine),
    ] {
      let mut variant = b.clone();
      variant.aspect_ratio = ar;
      let cost = variant.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap();
      assert_eq!(cost, baseline, "aspect_ratio {:?} changed cost", ar);
    }
  }

  // ── Combinatorial sanity ──

  #[test]
  fn combinatorial_positive_cost() {
    let resolutions = [
      Some(CommonResolution::FourEightyP),
      Some(CommonResolution::SevenTwentyP),
      Some(CommonResolution::TenEightyP),
    ];
    let durations = [Some(4u16), Some(5), Some(8), Some(12)];
    let audios = [Some(true), Some(false), None];

    let mut combos = 0;
    for &res in &resolutions {
      for &dur in &durations {
        for &audio in &audios {
          for factory in [t2v_builder, i2v_builder] {
            let cents = cost_cents(factory, res, dur, audio);
            assert!(cents > 0, "expected positive cost: res={:?} dur={:?} audio={:?}", res, dur, audio);
            combos += 1;
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 3 * 2);
  }
}
