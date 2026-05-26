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
