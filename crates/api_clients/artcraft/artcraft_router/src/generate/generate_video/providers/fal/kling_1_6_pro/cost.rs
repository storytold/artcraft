use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::kling_1_6_pro::request::{
  FalKling16ProMode, FalKling16ProRequestState,
};

#[derive(Clone, Debug)]
pub struct FalKling16ProCostState {
  pub cost_in_usd_cents: u64,
}

impl FalKling16ProCostState {
  pub fn from_request(request: &FalKling16ProRequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint `FalRequestCostCalculator`
    // implementations. The router state mirrors whichever calculator matches
    // the dispatched mode so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalKling16ProMode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalKling16ProMode::ImageToVideo(req) => req.calculate_cost_in_cents(),
      FalKling16ProMode::ElementsToVideo(req) => req.calculate_cost_in_cents(),
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
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents_with(mut configure: impl FnMut(&mut GenerateVideoRequestBuilder)) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling16Pro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    };
    configure(&mut b);
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  // ── Image-to-video ($0.095/sec) ──

  #[test]
  fn i2v_5s_is_48() {
    // ceil(95 × 5 / 10) = 48¢
    let cost = cost_cents_with(|b| {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
      b.duration_seconds = Some(5);
    });
    assert_eq!(cost, 48);
  }

  #[test]
  fn i2v_10s_is_95() {
    // ceil(95 × 10 / 10) = 95¢
    let cost = cost_cents_with(|b| {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
      b.duration_seconds = Some(10);
    });
    assert_eq!(cost, 95);
  }

  #[test]
  fn i2v_default_duration_is_5s_priced_at_48() {
    let cost = cost_cents_with(|b| {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    });
    assert_eq!(cost, 48);
  }

  // ── Text-to-video ($0.098/sec) ──

  #[test]
  fn t2v_5s_is_49() {
    // ceil(98 × 5 / 10) = 49¢
    let cost = cost_cents_with(|b| {
      b.duration_seconds = Some(5);
    });
    assert_eq!(cost, 49);
  }

  #[test]
  fn t2v_10s_is_98() {
    let cost = cost_cents_with(|b| {
      b.duration_seconds = Some(10);
    });
    assert_eq!(cost, 98);
  }

  #[test]
  fn t2v_default_duration_is_5s_priced_at_49() {
    let cost = cost_cents_with(|_b| {});
    assert_eq!(cost, 49);
  }

  // ── Elements-to-video ($0.098/sec, same as t2v) ──

  #[test]
  fn elements_5s_is_49() {
    let cost = cost_cents_with(|b| {
      b.reference_images = Some(ImageListRef::Urls(vec!["https://example.com/r.png".to_string()]));
      b.duration_seconds = Some(5);
    });
    assert_eq!(cost, 49);
  }

  #[test]
  fn elements_10s_is_98() {
    let cost = cost_cents_with(|b| {
      b.reference_images = Some(ImageListRef::Urls(vec!["https://example.com/r.png".to_string()]));
      b.duration_seconds = Some(10);
    });
    assert_eq!(cost, 98);
  }
}
