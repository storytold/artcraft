use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::providers::fal::flux_3::request::{
  FalFlux3Mode, FalFlux3RequestState,
};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

#[derive(Clone, Debug)]
pub struct FalFlux3CostState {
  pub cost_in_usd_cents: u64,
}

impl FalFlux3CostState {
  pub fn from_request(request: &FalFlux3RequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalFlux3Mode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalFlux3Mode::ImageToVideo(req) => req.calculate_cost_in_cents(),
      FalFlux3Mode::FirstLastFrameToVideo(req) => req.calculate_cost_in_cents(),
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
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::fal::flux_3::build::build_fal_flux_3_state;

  use super::*;

  // Pricing (from fal_client's flux_3 cost modules):
  //   720p: $0.17/s, 1080p: $0.29/s (all modalities)
  // fal defaults when unset: duration = 5s (auto estimates at the 5s floor),
  // resolution = 720p.

  #[test]
  fn t2v_default_settings_is_85() {
    assert_eq!(cost_cents(base_builder(None, None)), 85);
  }

  #[test]
  fn t2v_10s_1080p_is_290() {
    assert_eq!(cost_cents(base_builder(Some(10), Some(RouterResolution::TenEightyP))), 290);
  }

  #[test]
  fn i2v_5s_720p_is_85() {
    let mut b = base_builder(Some(5), Some(RouterResolution::SevenTwentyP));
    b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
    assert_eq!(cost_cents(b), 85);
  }

  #[test]
  fn first_last_frame_20s_1080p_is_580() {
    let mut b = base_builder(Some(20), Some(RouterResolution::TenEightyP));
    b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
    b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
    assert_eq!(cost_cents(b), 580);
  }

  #[test]
  fn estimate_cost_forwards_cents() {
    let estimate = FalFlux3CostState { cost_in_usd_cents: 85 }.estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(85));
    assert_eq!(estimate.cost_in_credits, Some(85));
    assert!(!estimate.is_free);
  }

  fn base_builder(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
  ) -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Flux3,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    }
  }

  fn cost_cents(builder: GenerateVideoRequestBuilder) -> u64 {
    let state = build_fal_flux_3_state(builder).expect("build");
    FalFlux3CostState::from_request(&state).cost_in_usd_cents
  }
}
