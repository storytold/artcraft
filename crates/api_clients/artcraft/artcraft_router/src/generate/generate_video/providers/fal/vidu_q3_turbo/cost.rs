use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::providers::fal::vidu_q3_turbo::request::{
  FalViduQ3TurboMode, FalViduQ3TurboRequestState,
};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

#[derive(Clone, Debug)]
pub struct FalViduQ3TurboCostState {
  pub cost_in_usd_cents: u64,
}

impl FalViduQ3TurboCostState {
  pub fn from_request(request: &FalViduQ3TurboRequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalViduQ3TurboMode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalViduQ3TurboMode::ImageToVideo(req) => req.calculate_cost_in_cents(),
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
  use crate::generate::generate_video::providers::fal::vidu_q3_turbo::build::build_fal_vidu_q3_turbo_state;

  use super::*;

  // Pricing (from fal_client's vidu_q3_turbo cost modules; half the Vidu Q3 rate):
  //   360p/540p:  $0.035/sec → 5s = 17.5¢ → 18¢
  //   720p/1080p: $0.077/sec → 5s = 38.5¢ → 39¢, 10s = 77¢ (ceil to whole cents)
  // fal defaults when unset: duration = 5s, resolution = 720p.
  // Both modes (text/image) bill identically.
  //
  // NB: `build2()` isn't wired up for Vidu Q3 Turbo yet, so these tests go
  // through `build_fal_vidu_q3_turbo_state()` directly.

  #[test]
  fn t2v_default_settings_is_39() {
    assert_eq!(cost_cents(base_builder(None, None)), 39);
  }

  #[test]
  fn t2v_5s_720p_rounds_up_to_39() {
    // 5 × 7.7¢ = 38.5¢ → 39¢.
    assert_eq!(cost_cents(base_builder(Some(5), Some(RouterResolution::SevenTwentyP))), 39);
  }

  #[test]
  fn t2v_5s_540p_rounds_up_to_18() {
    // RouterResolution::FourEightyP maps to Vidu's 540p; 5 × 3.5¢ = 17.5¢ → 18¢.
    assert_eq!(cost_cents(base_builder(Some(5), Some(RouterResolution::FourEightyP))), 18);
  }

  #[test]
  fn t2v_10s_1080p_is_77() {
    assert_eq!(cost_cents(base_builder(Some(10), Some(RouterResolution::TenEightyP))), 77);
  }

  #[test]
  fn t2v_3s_720p_rounds_up_to_24() {
    // 3 × 7.7¢ = 23.1¢ → 24¢.
    assert_eq!(cost_cents(base_builder(Some(3), Some(RouterResolution::SevenTwentyP))), 24);
  }

  #[test]
  fn i2v_5s_720p_is_39() {
    let mut b = base_builder(Some(5), Some(RouterResolution::SevenTwentyP));
    b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
    assert_eq!(cost_cents(b), 39);
  }

  #[test]
  fn i2v_10s_540p_is_35() {
    let mut b = base_builder(Some(10), Some(RouterResolution::FourEightyP));
    b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
    assert_eq!(cost_cents(b), 35);
  }

  #[test]
  fn estimate_cost_forwards_cents() {
    let estimate = FalViduQ3TurboCostState { cost_in_usd_cents: 39 }.estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(39));
    assert_eq!(estimate.cost_in_credits, Some(39));
    assert!(!estimate.is_free);
  }

  fn base_builder(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
  ) -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::ViduQ3Turbo,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    }
  }

  fn cost_cents(builder: GenerateVideoRequestBuilder) -> u64 {
    let state = build_fal_vidu_q3_turbo_state(builder).expect("build");
    FalViduQ3TurboCostState::from_request(&state).cost_in_usd_cents
  }
}
