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
    }
  }
}
