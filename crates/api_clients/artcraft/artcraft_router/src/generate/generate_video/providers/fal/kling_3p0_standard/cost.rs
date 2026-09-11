use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::kling_3p0_standard::request::{
  FalKling3p0StandardMode, FalKling3p0StandardRequestState,
};

#[derive(Clone, Debug)]
pub struct FalKling3p0StandardCostState {
  pub cost_in_usd_cents: u64,
}

impl FalKling3p0StandardCostState {
  pub fn from_request(request: &FalKling3p0StandardRequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalKling3p0StandardMode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalKling3p0StandardMode::ImageToVideo(req) => req.calculate_cost_in_cents(),
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
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::fal::kling_3p0_standard::build::build_fal_kling_3p0_standard_state;

  use super::*;

  // Pricing (fal): audio off $0.168/sec (rate=168 tenths-of-cents), audio on
  // $0.252/sec (rate=252), rounded up to whole cents.

  #[test]
  fn audio_on_5s_is_126() {
    // rate=252, (252*5 + 9) / 10 = 1269/10 = 126.
    assert_eq!(cost_cents(Some(5), Some(true)), 126);
  }

  #[test]
  fn audio_off_5s_is_84() {
    // rate=168, (168*5 + 9) / 10 = 849/10 = 84.
    assert_eq!(cost_cents(Some(5), Some(false)), 84);
  }

  #[test]
  fn audio_on_10s_is_252() {
    assert_eq!(cost_cents(Some(10), Some(true)), 252);
  }

  #[test]
  fn audio_off_15s_is_252() {
    // (168*15 + 9) / 10 = 2529/10 = 252.
    assert_eq!(cost_cents(Some(15), Some(false)), 252);
  }

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling3p0Standard,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    let state = build_fal_kling_3p0_standard_state(b).expect("build_fal_kling_3p0_standard_state");
    FalKling3p0StandardCostState::from_request(&state)
      .estimate_cost()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents")
  }
}
