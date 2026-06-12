use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::happy_horse_1p0::request::ArtcraftHappyHorse1p0RequestState;

// ── Pricing ──
//
// Happy Horse 1.0 upstream credit pricing:
//
// | Resolution | Credits/sec |
// |------------|-------------|
// | 720p       |          33 |
// | 1080p      |          66 |
//
// Default resolution (None) is 720p.
// Batch count multiplies the total cost.
// Credit package (historical): 22,000 credits for $114 (~193 credits/$1).
// The upstream package is now 525,000 credits for $2,159.0909 (~243 credits/$1),
// but user pricing is intentionally kept at the 193-derived rates.
//
// ArtCraft credits: 100 credits = $1.00, so ArtCraft credits = USD cents.
// We compute USD cents from upstream credits ÷ credits_per_dollar × 100.

const UPSTREAM_CREDITS_PER_SECOND_720P: u32 = 33;
const UPSTREAM_CREDITS_PER_SECOND_1080P: u32 = 66;
// Frozen at the historical rate so user pricing doesn't shift with the package deal.
const UPSTREAM_CREDITS_PER_DOLLAR: f64 = 193.0;

pub struct ArtcraftHappyHorse1p0CostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
}

impl ArtcraftHappyHorse1p0CostState {
  pub fn from_request(request: &ArtcraftHappyHorse1p0RequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);

    Self { resolution, duration_seconds, batch_count }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let credits_per_second = match self.resolution {
      CommonResolution::TenEightyP => UPSTREAM_CREDITS_PER_SECOND_1080P,
      _ => UPSTREAM_CREDITS_PER_SECOND_720P,
    };

    let upstream_credits = credits_per_second as u64
      * self.duration_seconds as u64
      * self.batch_count as u64;

    let usd_cents = (upstream_credits as f64 / UPSTREAM_CREDITS_PER_DOLLAR * 100.0).round() as u64;

    // ArtCraft credits = USD cents.
    VideoGenerationCostEstimate {
      cost_in_credits: Some(usd_cents),
      cost_in_usd_cents: Some(usd_cents),
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
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  // ── 720p pricing (33 upstream credits/sec) ──

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      // 33 credits/sec; upstream_credits / 193 * 100
      // (NB: duration 3s is clamped to 4s by the builder)
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 1), 68);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1), 85);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1), 171);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1), 256);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2), 171);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4), 342);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 5, 1), cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1));
    }
  }

  // ── 1080p pricing (66 upstream credits/sec) ──

  mod pricing_1080p {
    use super::*;

    #[test]
    fn batch_1() {
      // 66 credits/sec; upstream_credits / 193 * 100
      // (NB: duration 3s is clamped to 4s by the builder)
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 4, 1), 137);
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 5, 1), 171);
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 10, 1), 342);
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 15, 1), 513);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 5, 2), 342);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 5, 4), 684);
    }
  }

  // ── Relative pricing ──

  mod relative_pricing {
    use super::*;

    #[test]
    fn cost_720p_cheaper_than_1080p() {
      let c720 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1);
      let c1080 = cost_cents(Some(RouterResolution::TenEightyP), 5, 1);
      assert!(c720 < c1080);
    }

    #[test]
    fn r1080p_approximately_double_720p() {
      // 1080p upstream credits are exactly 2× 720p, but USD cents may differ
      // by ±1 due to rounding (each is rounded independently).
      for dur in [4u16, 5, 10, 15] {
        let c720 = cost_cents(Some(RouterResolution::SevenTwentyP), dur, 1);
        let c1080 = cost_cents(Some(RouterResolution::TenEightyP), dur, 1);
        let expected = c720 * 2;
        assert!(
          c1080 >= expected - 1 && c1080 <= expected + 1,
          "1080p ({}) should be ~2× 720p ({}) at {}s", c1080, c720, dur,
        );
      }
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = cost_cents(None, 4, 1);
      let c10 = cost_cents(None, 10, 1);
      let c15 = cost_cents(None, 15, 1);
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = cost_cents(None, 5, 1);
      let b2 = cost_cents(None, 5, 2);
      let b4 = cost_cents(None, 5, 4);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }
  }

  // ── Credits equal cents ──

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      let resolutions = [
        Some(RouterResolution::SevenTwentyP),
        Some(RouterResolution::TenEightyP),
        None,
      ];
      for res in resolutions {
        for dur in [4, 5, 10, 15] {
          for batch in [1, 2, 4] {
            let cost = build_cost(res, dur, batch);
            assert_eq!(
              cost.cost_in_credits, cost.cost_in_usd_cents,
              "credits should equal cents for res={:?} dur={}s batch={}",
              res, dur, batch,
            );
          }
        }
      }
    }
  }

  // ── Helpers ──

  fn build_cost(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::HappyHorse1p0,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };
    builder.build2()
      .expect("build2 should succeed")
      .estimate_cost()
      .expect("estimate_cost should succeed")
  }

  fn cost_cents(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> u64 {
    build_cost(resolution, duration_seconds, video_batch_count)
      .cost_in_usd_cents
      .unwrap()
  }
}
