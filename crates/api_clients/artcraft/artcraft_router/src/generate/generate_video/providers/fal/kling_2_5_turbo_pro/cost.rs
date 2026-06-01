use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::kling_2_5_turbo_pro::request::{
  FalKling2p5TurboProMode, FalKling2p5TurboProRequestState,
};

#[derive(Clone, Debug)]
pub struct FalKling2p5TurboProCostState {
  pub cost_in_usd_cents: u64,
}

impl FalKling2p5TurboProCostState {
  pub fn from_request(request: &FalKling2p5TurboProRequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint `FalRequestCostCalculator`
    // implementations.
    let cost_in_usd_cents = match &request.mode {
      FalKling2p5TurboProMode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalKling2p5TurboProMode::ImageToVideo(req) => req.calculate_cost_in_cents(),
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
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, has_start: bool) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling2p5TurboPro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    };
    if has_start {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    }
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  // Pricing: $0.07/sec flat → 5s = 35¢, 10s = 70¢. Same for t2v and i2v.

  #[test]
  fn t2v_5s_is_35() { assert_eq!(cost_cents(Some(5), false), 35); }

  #[test]
  fn t2v_10s_is_70() { assert_eq!(cost_cents(Some(10), false), 70); }

  #[test]
  fn i2v_5s_is_35() { assert_eq!(cost_cents(Some(5), true), 35); }

  #[test]
  fn i2v_10s_is_70() { assert_eq!(cost_cents(Some(10), true), 70); }

  #[test]
  fn default_is_5s_priced_at_35() { assert_eq!(cost_cents(None, false), 35); }
}
