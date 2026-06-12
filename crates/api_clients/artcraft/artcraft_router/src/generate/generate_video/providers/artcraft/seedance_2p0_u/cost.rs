use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_2p0_u::request::ArtcraftSeedance2p0UltraRequestState;

// ── Pricing constants ──

const CENTS_PER_SECOND_480P: f64 = 5.4404;
const CENTS_PER_SECOND_720P: f64 = 11.2;
const CENTS_PER_SECOND_1080P: f64 = 32.6424;

pub struct ArtcraftSeedance2p0UltraCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
}

impl ArtcraftSeedance2p0UltraCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0UltraRequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);

    Self { resolution, duration_seconds, batch_count }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      CommonResolution::TenEightyP => CENTS_PER_SECOND_1080P,
      _ => CENTS_PER_SECOND_720P,
    };

    let cents_per_video = (cents_per_second * self.duration_seconds as f64).ceil() as u64;
    let usd_cents = cents_per_video * self.batch_count as u64;

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

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      // 11.2 * 5 = 56¢
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1), 56);
      // 11.2 * 10 = 112¢
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1), 112);
      // 11.2 * 15 = 168¢
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1), 168);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2), 112);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, 2), 224);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4), 224);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 10, 1), cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1));
    }
  }

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      // 5.4404 * 5 = 27.202 → ceil = 28¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 1), 28);
      // 5.4404 * 10 = 54.404 → ceil = 55¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, 1), 55);
      // 5.4404 * 15 = 81.606 → ceil = 82¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15, 1), 82);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, 4), 220);
    }
  }

  mod pricing_1080p {
    use super::*;

    #[test]
    fn batch_1() {
      // 32.6424 * 5 = 163.212 → ceil = 164¢
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 5, 1), 164);
      // 32.6424 * 10 = 326.424 → ceil = 327¢
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 10, 1), 327);
      // 32.6424 * 15 = 489.636 → ceil = 490¢
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 15, 1), 490);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::TenEightyP), 10, 4), 1308);
    }
  }

  mod relative_pricing {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p_cheaper_than_1080p() {
      let c480 = cost_cents(Some(RouterResolution::FourEightyP), 10, 1);
      let c720 = cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1);
      let c1080 = cost_cents(Some(RouterResolution::TenEightyP), 10, 1);
      assert!(c480 < c720);
      assert!(c720 < c1080);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c5 = cost_cents(None, 5, 1);
      let c10 = cost_cents(None, 10, 1);
      let c15 = cost_cents(None, 15, 1);
      assert!(c5 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = cost_cents(None, 10, 1);
      let b2 = cost_cents(None, 10, 2);
      let b4 = cost_cents(None, 10, 4);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }

    #[test]
    fn credits_equal_usd_cents() {
      let cost = build_cost(None, 10, 1);
      assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
    }
  }

  // -- Helpers --

  fn build_cost(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0Ultra,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };
    builder.build2().expect("build2").estimate_cost().expect("estimate_cost")
  }

  fn cost_cents(resolution: Option<RouterResolution>, duration_seconds: u16, batch: u16) -> u64 {
    build_cost(resolution, duration_seconds, batch).cost_in_usd_cents.unwrap()
  }
}
