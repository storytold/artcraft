use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::veo_2::request::{FalVeo2Mode, FalVeo2RequestState};

#[derive(Clone, Debug)]
pub struct FalVeo2CostState {
  pub cost_in_usd_cents: u64,
}

impl FalVeo2CostState {
  pub fn from_request(request: &FalVeo2RequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    let cost_in_usd_cents = match &request.mode {
      FalVeo2Mode::TextToVideo(req) => req.calculate_cost_in_cents(),
      FalVeo2Mode::ImageToVideo(req) => req.calculate_cost_in_cents(),
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
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::fal::veo_2::build::build_fal_veo_2_state;

  use super::*;

  // Pricing (fal): 5s = $2.50, +$0.50 per additional second. Flat across
  // modalities; no audio or resolution knobs.

  mod numeric_literal_pricing {
    use super::*;

    #[test]
    fn default_duration_is_5s_priced_at_250() {
      // 5s = $2.50 baseline.
      assert_eq!(cost_cents(None, false), 250);
    }

    #[test]
    fn five_seconds_is_250() {
      assert_eq!(cost_cents(Some(5), false), 250);
    }

    #[test]
    fn six_seconds_is_300() {
      // +$0.50 per second past 5s.
      assert_eq!(cost_cents(Some(6), false), 300);
    }

    #[test]
    fn seven_seconds_is_350() {
      assert_eq!(cost_cents(Some(7), false), 350);
    }

    #[test]
    fn eight_seconds_is_400() {
      assert_eq!(cost_cents(Some(8), false), 400);
    }

    #[test]
    fn i2v_matches_t2v() {
      assert_eq!(cost_cents(Some(7), false), cost_cents(Some(7), true));
    }
  }

  #[test]
  fn longer_duration_costs_more() {
    assert!(cost_cents(Some(5), false) < cost_cents(Some(6), false));
    assert!(cost_cents(Some(6), false) < cost_cents(Some(7), false));
    assert!(cost_cents(Some(7), false) < cost_cents(Some(8), false));
  }

  fn cost_cents(duration_seconds: Option<u16>, has_start_frame: bool) -> u64 {
    let mut b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo2,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      ..Default::default()
    };
    if has_start_frame {
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
    }
    let state = build_fal_veo_2_state(b).expect("build_fal_veo_2_state");
    FalVeo2CostState::from_request(&state)
      .estimate_cost()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents")
  }
}
