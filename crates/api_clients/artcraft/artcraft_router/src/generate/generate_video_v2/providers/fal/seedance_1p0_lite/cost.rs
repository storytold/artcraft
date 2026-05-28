use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::fal::seedance_1p0_lite::request::FalSeedance10LiteRequestState;

pub struct FalSeedance10LiteCostState {
  request: FalSeedance10LiteRequestState,
}

impl FalSeedance10LiteCostState {
  pub fn from_request(request: &FalSeedance10LiteRequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors v1 — delegate to the Fal client's cost calculator for billing parity.
    let cost_in_usd_cents = self.request.request.calculate_cost_in_cents();

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

#[cfg(test)]
mod tests {
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  // ── Helpers ──

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance10Lite,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      start_frame: Some(ImageRef::Url("https://example.com/start.png".to_string())),
      ..Default::default()
    }
  }

  fn cost_cents(resolution: Option<RouterResolution>, duration_seconds: Option<u16>) -> u64 {
    let mut b = base_builder();
    b.resolution = resolution;
    b.duration_seconds = duration_seconds;
    b.build2()
      .expect("build2")
      .estimate_cost()
      .expect("estimate_cost")
      .cost_in_usd_cents
      .expect("cost_in_usd_cents")
  }

  // ── Numeric literal price assertions (break if pricing changes) ──

  mod pricing_720p {
    use super::*;

    #[test]
    fn p720_5s_special_case() {
      // Per the Fal cost calculator: 720p + 5s short-circuits to 18¢.
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), Some(5)), 18);
    }

    #[test]
    fn p720_10s() {
      // 1280×720×30 fps × 10s / 1024 = 270000 tokens × $1.8/M = $0.486 → ceil = 49¢.
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), Some(10)), 49);
    }

    #[test]
    fn p720_default_duration_matches_5s() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), None), 18);
    }

    #[test]
    fn default_resolution_default_duration_matches_720p_5s() {
      assert_eq!(cost_cents(None, None), 18);
    }
  }

  mod pricing_480p {
    use super::*;

    #[test]
    fn p480_5s() {
      // 640×480×30×5/1024 = 45000 × $1.8/M = $0.081 → ceil = 9¢.
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), Some(5)), 9);
    }

    #[test]
    fn p480_10s() {
      // 640×480×30×10/1024 = 90000 × $1.8/M = $0.162 → ceil = 17¢.
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), Some(10)), 17);
    }
  }

  mod pricing_1080p {
    use super::*;

    #[test]
    fn p1080_5s() {
      // 1920×1080×30×5/1024 = 303750 × $1.8/M = $0.54675 → ceil = 55¢.
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), Some(5)), 55);
    }

    #[test]
    fn p1080_10s() {
      // 1920×1080×30×10/1024 = 607500 × $1.8/M = $1.0935 → ceil = 110¢.
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), Some(10)), 110);
    }
  }

  // ── Relative pricing invariants ──

  mod relative_pricing {
    use super::*;

    #[test]
    fn higher_resolution_costs_more() {
      let p480 = cost_cents(Some(RouterResolution::FourEightyP), Some(10));
      let p720 = cost_cents(Some(RouterResolution::SevenTwentyP), Some(10));
      let p1080 = cost_cents(Some(RouterResolution::TenEightyP), Some(10));
      assert!(p480 < p720, "480p ({p480}) should be < 720p ({p720})");
      assert!(p720 < p1080, "720p ({p720}) should be < 1080p ({p1080})");
    }

    #[test]
    fn longer_duration_costs_more() {
      let d5 = cost_cents(Some(RouterResolution::TenEightyP), Some(5));
      let d10 = cost_cents(Some(RouterResolution::TenEightyP), Some(10));
      assert!(d5 < d10, "5s ({d5}) should be < 10s ({d10})");
    }
  }

  // ── Combinatorial sanity: every supported (res, dur, ar) yields a positive cost ──

  #[test]
  fn combinatorial_positive_cost() {
    let resolutions = [
      Some(RouterResolution::FourEightyP),
      Some(RouterResolution::SevenTwentyP),
      Some(RouterResolution::TenEightyP),
    ];
    let durations = [Some(5u16), Some(10u16)];
    let aspect_ratios = [
      None,
      Some(RouterAspectRatio::Auto),
      Some(RouterAspectRatio::Square),
      Some(RouterAspectRatio::WideSixteenByNine),
      Some(RouterAspectRatio::TallNineBySixteen),
    ];

    let mut combos = 0;
    for &res in &resolutions {
      for &dur in &durations {
        for &ar in &aspect_ratios {
          let mut b = base_builder();
          b.resolution = res;
          b.duration_seconds = dur;
          b.aspect_ratio = ar;
          let cents = b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap();
          assert!(cents > 0, "expected positive cost for res={:?} dur={:?} ar={:?}", res, dur, ar);
          combos += 1;
        }
      }
    }
    assert_eq!(combos, 30);
  }

  // Aspect ratio doesn't influence cost (calculator only uses resolution and duration).
  #[test]
  fn aspect_ratio_does_not_affect_cost() {
    let with_wide = cost_cents(Some(RouterResolution::SevenTwentyP), Some(10));
    let mut b = base_builder();
    b.resolution = Some(RouterResolution::SevenTwentyP);
    b.duration_seconds = Some(10);
    b.aspect_ratio = Some(RouterAspectRatio::Square);
    let with_square = b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap();
    assert_eq!(with_wide, with_square);
  }

  // End frame doesn't influence cost.
  #[test]
  fn end_frame_does_not_affect_cost() {
    let without = cost_cents(Some(RouterResolution::TenEightyP), Some(5));
    let mut b = base_builder();
    b.resolution = Some(RouterResolution::TenEightyP);
    b.duration_seconds = Some(5);
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    let with_end = b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap();
    assert_eq!(without, with_end);
  }
}
