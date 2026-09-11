use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::providers::fal::minimax_h3::request::{
  FalMinimaxH3Mode, FalMinimaxH3RequestState,
};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

#[derive(Clone, Debug)]
pub struct FalMinimaxH3CostState {
  pub cost_in_usd_cents: u64,
}

impl FalMinimaxH3CostState {
  pub fn from_request(request: &FalMinimaxH3RequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalMinimaxH3Mode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalMinimaxH3Mode::ImageToVideo(req) => req.calculate_cost_in_cents(),
      FalMinimaxH3Mode::ReferenceToVideo(req) => req.calculate_cost_in_cents(),
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
  use crate::generate::generate_video::providers::fal::minimax_h3::build::build_fal_minimax_h3_state;

  use super::*;

  // Pricing (from fal_client's minimax_h3 cost modules):
  //   768P: $0.16/sec → 5s = 80¢
  //   2K:   $0.26/sec → 5s = 130¢, 10s = 260¢
  // Reference-to-video additionally bills 8¢ per reference image beyond the
  // first 5. fal defaults when unset: duration = 5s, resolution = 2K.

  #[test]
  fn t2v_default_settings_is_130() {
    assert_eq!(cost_cents(base_builder(None, None)), 130);
  }

  #[test]
  fn t2v_5s_768p_is_80() {
    // RouterResolution::SevenTwentyP maps to H3's 768P.
    assert_eq!(cost_cents(base_builder(Some(5), Some(RouterResolution::SevenTwentyP))), 80);
  }

  #[test]
  fn t2v_10s_2k_is_260() {
    assert_eq!(cost_cents(base_builder(Some(10), Some(RouterResolution::TenEightyP))), 260);
  }

  #[test]
  fn i2v_5s_768p_is_80() {
    let mut b = base_builder(Some(5), Some(RouterResolution::FourEightyP));
    b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
    assert_eq!(cost_cents(b), 80);
  }

  #[test]
  fn reference_five_images_5s_2k_is_130() {
    assert_eq!(cost_cents(builder_with_references(5, Some(RouterResolution::TenEightyP))), 130);
  }

  #[test]
  fn reference_nine_images_5s_2k_is_162() {
    // 130¢ video + 4 extra images × 8¢ = 162¢.
    assert_eq!(cost_cents(builder_with_references(9, Some(RouterResolution::TenEightyP))), 162);
  }

  #[test]
  fn estimate_cost_forwards_cents() {
    let estimate = FalMinimaxH3CostState { cost_in_usd_cents: 130 }.estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(130));
    assert_eq!(estimate.cost_in_credits, Some(130));
    assert!(!estimate.is_free);
  }

  fn base_builder(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
  ) -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::MinimaxH3,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    }
  }

  fn builder_with_references(
    image_count: usize,
    resolution: Option<RouterResolution>,
  ) -> GenerateVideoRequestBuilder {
    let urls = (0..image_count)
      .map(|i| format!("https://example.com/ref-{}.png", i))
      .collect();
    let mut b = base_builder(Some(5), resolution);
    b.reference_images = Some(ImageListRef::Urls(urls));
    b
  }

  fn cost_cents(builder: GenerateVideoRequestBuilder) -> u64 {
    let state = build_fal_minimax_h3_state(builder).expect("build");
    FalMinimaxH3CostState::from_request(&state).cost_in_usd_cents
  }
}
