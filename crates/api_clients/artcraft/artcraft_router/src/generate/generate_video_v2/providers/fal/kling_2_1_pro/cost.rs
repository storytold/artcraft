use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::Kling2p1ProDuration;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::fal::kling_2_1_pro::request::FalKling21ProRequestState;

#[derive(Clone, Debug)]
pub struct FalKling21ProCostState {
  pub is_ten_seconds: bool,
}

impl FalKling21ProCostState {
  pub fn from_request(request: &FalKling21ProRequestState) -> Self {
    Self {
      is_ten_seconds: matches!(request.request.duration, Kling2p1ProDuration::TenSeconds),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_v2p1_pro: 5s = 45¢, 10s = 90¢.
    let cost_in_usd_cents: u64 = if self.is_ten_seconds { 90 } else { 45 };

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

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling21Pro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      start_frame: Some(ImageRef::Url("https://example.com/a.png".to_string())),
      duration_seconds,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn five_seconds_is_45() { assert_eq!(cost_cents(Some(5)), 45); }

  #[test]
  fn ten_seconds_is_90() { assert_eq!(cost_cents(Some(10)), 90); }

  #[test]
  fn default_duration_is_5s_priced_at_45() { assert_eq!(cost_cents(None), 45); }
}
