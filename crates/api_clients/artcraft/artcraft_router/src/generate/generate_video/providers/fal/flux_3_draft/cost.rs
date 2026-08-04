use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::providers::fal::flux_3_draft::request::{
  FalFlux3DraftMode, FalFlux3DraftRequestState,
};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

#[derive(Clone, Debug)]
pub struct FalFlux3DraftCostState {
  pub cost_in_usd_cents: u64,
}

impl FalFlux3DraftCostState {
  pub fn from_request(request: &FalFlux3DraftRequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalFlux3DraftMode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalFlux3DraftMode::ImageToVideo(req) => req.calculate_cost_in_cents(),
      FalFlux3DraftMode::FirstLastFrameToVideo(req) => req.calculate_cost_in_cents(),
    };
    Self { cost_in_usd_cents }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    VideoGenerationCostEstimate {
      cost_in_credits: Some(self.cost_in_usd_cents),
      cost_in_usd_cents: Some(self.cost_in_usd_cents),
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
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::fal::flux_3_draft::build::build_fal_flux_3_draft_state;

  use super::*;

  // Pricing (from fal_client's flux_3_draft cost modules):
  //   $0.06/s (always 720p, all modalities)
  // fal defaults when unset: duration = 5s (auto estimates at the 5s floor).

  #[test]
  fn t2v_default_settings_is_30() {
    assert_eq!(cost_cents(base_builder(None)), 30);
  }

  #[test]
  fn t2v_20s_is_120() {
    assert_eq!(cost_cents(base_builder(Some(20))), 120);
  }

  fn base_builder(duration_seconds: Option<u16>) -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Flux3Draft,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    }
  }

  fn cost_cents(builder: GenerateVideoRequestBuilder) -> u64 {
    let state = build_fal_flux_3_draft_state(builder).expect("build");
    FalFlux3DraftCostState::from_request(&state).cost_in_usd_cents
  }
}
