use gmicloud_client::traits::gmicloud_request_cost_calculator_trait::GmiCloudRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_g::request::GmiCloudSeedance2p0GRequestState;

pub struct GmiCloudSeedance2p0GCostState {
  request: GmiCloudSeedance2p0GRequestState,
}

impl GmiCloudSeedance2p0GCostState {
  pub fn from_request(request: &GmiCloudSeedance2p0GRequestState) -> Self {
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
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  mod pricing_720p {
    use super::*;

    #[test]
    fn default_5s() {
      // 720p default: 5.2 tenths/s * 5 = 26 → ceil = 26 → div_ceil(10) = 3¢
      assert_eq!(cost_cents(None, 5), 3);
    }

    #[test]
    fn default_10s() {
      assert_eq!(cost_cents(None, 10), 6);
    }

    #[test]
    fn explicit_720p_5s() {
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5), 3);
    }
  }

  mod pricing_480p {
    use super::*;

    #[test]
    fn p480_5s() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5), 2);
    }

    #[test]
    fn p480_10s() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 10), 3);
    }

    #[test]
    fn p480_15s() {
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 15), 4);
    }
  }

  mod pricing_1080p {
    use super::*;

    #[test]
    fn p1080_5s() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 5), 6);
    }

    #[test]
    fn p1080_10s() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 10), 12);
    }

    #[test]
    fn p1080_15s() {
      assert_eq!(cost_cents(Some(CommonResolution::TenEightyP), 15), 18);
    }
  }

  mod relative_pricing {
    use super::*;

    #[test]
    fn higher_resolution_costs_more() {
      let c480 = cost_cents(Some(CommonResolution::FourEightyP), 10);
      let c720 = cost_cents(Some(CommonResolution::SevenTwentyP), 10);
      let c1080 = cost_cents(Some(CommonResolution::TenEightyP), 10);
      assert!(c480 < c720, "480p ({c480}) should be < 720p ({c720})");
      assert!(c720 < c1080, "720p ({c720}) should be < 1080p ({c1080})");
    }

    #[test]
    fn longer_duration_costs_more() {
      let c5 = cost_cents(None, 5);
      let c10 = cost_cents(None, 10);
      let c15 = cost_cents(None, 15);
      assert!(c5 < c10);
      assert!(c10 < c15);
    }
  }

  fn cost_cents(resolution: Option<CommonResolution>, duration_seconds: u16) -> u64 {
    let builder = GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0Global,
      provider: Provider::GmiCloud,
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
