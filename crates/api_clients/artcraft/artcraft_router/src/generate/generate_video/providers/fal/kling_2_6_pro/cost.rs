use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::kling_2_6_pro::request::{
  FalKling2p6ProMode, FalKling2p6ProRequestState,
};

#[derive(Clone, Debug)]
pub struct FalKling2p6ProCostState {
  pub cost_in_usd_cents: u64,
}

impl FalKling2p6ProCostState {
  pub fn from_request(request: &FalKling2p6ProRequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalKling2p6ProMode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalKling2p6ProMode::ImageToVideo(req) => req.calculate_cost_in_cents(),
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

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>, has_start: bool) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling2p6Pro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    if has_start {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    }
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  // Pricing:
  //   audio off: $0.07/sec  → 5s=35¢, 10s=70¢
  //   audio on:  $0.14/sec  → 5s=70¢, 10s=140¢
  // Image-to-video adds a third tier ($0.168/sec) for voice control, but
  // the router build doesn't expose voice_ids yet, so it's not tested here.

  #[test]
  fn t2v_audio_off_5s_is_35() { assert_eq!(cost_cents(Some(5), Some(false), false), 35); }

  #[test]
  fn t2v_audio_off_10s_is_70() { assert_eq!(cost_cents(Some(10), Some(false), false), 70); }

  #[test]
  fn t2v_audio_on_5s_is_70() { assert_eq!(cost_cents(Some(5), Some(true), false), 70); }

  #[test]
  fn t2v_audio_on_10s_is_140() { assert_eq!(cost_cents(Some(10), Some(true), false), 140); }

  #[test]
  fn i2v_audio_off_5s_is_35() { assert_eq!(cost_cents(Some(5), Some(false), true), 35); }

  #[test]
  fn i2v_audio_on_5s_is_70() { assert_eq!(cost_cents(Some(5), Some(true), true), 70); }

  #[test]
  fn audio_default_is_on() {
    // generate_audio=None defaults to true on fal's server.
    assert_eq!(
      cost_cents(Some(5), None, false),
      cost_cents(Some(5), Some(true), false),
    );
  }
}
