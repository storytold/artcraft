use gmicloud_client::traits::gmicloud_request_cost_calculator_trait::GmiCloudRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::gmicloud::seedance_2p0_fast_g::request::GmiCloudSeedance2p0UltraFastRequestState;

pub struct GmiCloudSeedance2p0UltraFastCostState {
  request: GmiCloudSeedance2p0UltraFastRequestState,
}

impl GmiCloudSeedance2p0UltraFastCostState {
  pub fn from_request(request: &GmiCloudSeedance2p0UltraFastRequestState) -> Self {
    Self { request: request.clone() }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cost_in_usd_cents = self.request.request.calculate_cost_in_cents();

    VideoGenerationCostEstimate {
      cost_in_credits: None,
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
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  mod pricing_720p {
    use super::*;

    #[test]
    fn default_5s() {
      // 720p: 3.1 ¢/s * 5 = 15.5 → ceil = 16¢
      assert_eq!(cost_cents(None, 5), 16);
    }

    #[test]
    fn default_10s() {
      // 3.1 * 10 = 31¢
      assert_eq!(cost_cents(None, 10), 31);
    }

    #[test]
    fn default_15s() {
      // 3.1 * 15 = 46.5 → ceil = 47¢
      assert_eq!(cost_cents(None, 15), 47);
    }
  }

  mod pricing_480p {
    use super::*;

    #[test]
    fn p480_5s() {
      // 1.0 * 5 = 5¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5), 5);
    }

    #[test]
    fn p480_10s() {
      // 1.0 * 10 = 10¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10), 10);
    }

    #[test]
    fn p480_15s() {
      // 1.0 * 15 = 15¢
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15), 15);
    }
  }

  mod relative_pricing {
    use super::*;

    #[test]
    fn higher_resolution_costs_more() {
      let c480 = cost_cents(Some(RouterResolution::FourEightyP), 10);
      let c720 = cost_cents(Some(RouterResolution::SevenTwentyP), 10);
      assert!(c480 < c720, "480p ({c480}) should be < 720p ({c720})");
    }

    #[test]
    fn fast_cheaper_than_standard() {
      let fast = cost_cents(Some(RouterResolution::SevenTwentyP), 10);
      let standard = {
        let builder = GenerateVideoRequestBuilder {
          model: RouterVideoModel::Seedance2p0Ultra,
          provider: RouterProvider::GmiCloud,
          resolution: Some(RouterResolution::SevenTwentyP),
          duration_seconds: Some(10),
          video_batch_count: Some(1),
          ..Default::default()
        };
        builder.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
      };
      assert!(fast < standard, "Fast ({fast}¢) should be < Standard ({standard}¢)");
    }
  }

  fn cost_cents(resolution: Option<RouterResolution>, duration_seconds: u16) -> u64 {
    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0UltraFast,
      provider: RouterProvider::GmiCloud,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(1),
      ..Default::default()
    };
    builder.build2()
      .expect("build2 should succeed")
      .estimate_cost()
      .expect("estimate_cost should succeed")
      .cost_in_usd_cents
      .unwrap()
  }
}
