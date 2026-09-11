use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::providers::fal::vidu_q3::request::{
  FalViduQ3Mode, FalViduQ3RequestState,
};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

#[derive(Clone, Debug)]
pub struct FalViduQ3CostState {
  pub cost_in_usd_cents: u64,
}

impl FalViduQ3CostState {
  pub fn from_request(request: &FalViduQ3RequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalViduQ3Mode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalViduQ3Mode::ImageToVideo(req) => req.calculate_cost_in_cents(),
      FalViduQ3Mode::ReferenceToVideo(req) => req.calculate_cost_in_cents(),
      FalViduQ3Mode::ReferenceToVideoMix(req) => req.calculate_cost_in_cents(),
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
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::fal::vidu_q3::build::build_fal_vidu_q3_state;

  use super::*;

  // Pricing (from fal_client's vidu_q3 cost modules):
  //   360p/540p:  $0.07/sec  → 5s = 35¢
  //   720p/1080p: $0.154/sec → 5s = 77¢, 10s = 154¢ (ceil to whole cents)
  // fal defaults when unset: duration = 5s, resolution = 720p.
  // All four modes (text/image/reference/mix) bill identically.
  //
  // NB: `build2()` isn't wired up for Vidu Q3 yet, so these tests go through
  // `build_fal_vidu_q3_state()` directly.

  #[test]
  fn t2v_default_settings_is_77() {
    assert_eq!(cost_cents(base_builder(None, None)), 77);
  }

  #[test]
  fn t2v_5s_720p_is_77() {
    assert_eq!(cost_cents(base_builder(Some(5), Some(RouterResolution::SevenTwentyP))), 77);
  }

  #[test]
  fn t2v_5s_540p_is_35() {
    // RouterResolution::FourEightyP maps to Vidu's 540p.
    assert_eq!(cost_cents(base_builder(Some(5), Some(RouterResolution::FourEightyP))), 35);
  }

  #[test]
  fn t2v_10s_1080p_is_154() {
    assert_eq!(cost_cents(base_builder(Some(10), Some(RouterResolution::TenEightyP))), 154);
  }

  #[test]
  fn t2v_3s_720p_rounds_up_to_47() {
    // 3 × 15.4¢ = 46.2¢ → 47¢.
    assert_eq!(cost_cents(base_builder(Some(3), Some(RouterResolution::SevenTwentyP))), 47);
  }

  #[test]
  fn i2v_5s_720p_is_77() {
    let mut b = base_builder(Some(5), Some(RouterResolution::SevenTwentyP));
    b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
    assert_eq!(cost_cents(b), 77);
  }

  #[test]
  fn reference_5s_540p_is_35() {
    let mut b = base_builder(Some(5), Some(RouterResolution::FourEightyP));
    b.reference_images = Some(ImageListRef::Urls(vec![
      "https://example.com/ref-0.png".to_string(),
    ]));
    assert_eq!(cost_cents(b), 35);
  }

  #[test]
  fn reference_mix_10s_1080p_is_154() {
    let mut b = base_builder(Some(10), Some(RouterResolution::TenEightyP));
    b.reference_images = Some(ImageListRef::Urls(vec![
      "https://example.com/ref-0.png".to_string(),
      "https://example.com/ref-1.png".to_string(),
      "https://example.com/ref-2.png".to_string(),
    ]));
    assert_eq!(cost_cents(b), 154);
  }

  #[test]
  fn estimate_cost_forwards_cents() {
    let estimate = FalViduQ3CostState { cost_in_usd_cents: 77 }.estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(77));
    assert_eq!(estimate.cost_in_credits, Some(77));
    assert!(!estimate.is_free);
  }

  fn base_builder(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
  ) -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::ViduQ3,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    }
  }

  fn cost_cents(builder: GenerateVideoRequestBuilder) -> u64 {
    let state = build_fal_vidu_q3_state(builder).expect("build");
    FalViduQ3CostState::from_request(&state).cost_in_usd_cents
  }
}
