use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::flux_pro_1p1::request::FalFluxPro1p1RequestState;

pub struct FalFluxPro1p1CostState {
  cost_in_usd_cents: u64,
}

impl FalFluxPro1p1CostState {
  pub fn from_request(request: &FalFluxPro1p1RequestState) -> Self {
    // Delegate to the fal_client cost calculator: $0.04 per image (1MP base).
    Self {
      cost_in_usd_cents: request.request.calculate_cost_in_cents(),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    // Matches v1: credits == cents (1:1 with USD cents).
    ImageGenerationCostEstimate {
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
  use super::*;
  use fal_client::requests::webhook::image::text::enqueue_flux_pro_11_text_to_image_webhook::{
    FluxPro11AspectRatio, FluxPro11NumImages, FluxPro11Request,
  };

  fn cost_for(n: FluxPro11NumImages) -> ImageGenerationCostEstimate {
    let state = FalFluxPro1p1CostState::from_request(&FalFluxPro1p1RequestState {
      request: FluxPro11Request {
        prompt: "test".to_string(),
        aspect_ratio: FluxPro11AspectRatio::Square,
        num_images: n,
      },
    });
    state.estimate_cost()
  }

  #[test]
  fn one_image_is_4_cents() {
    assert_eq!(cost_for(FluxPro11NumImages::One).cost_in_usd_cents, Some(4));
  }

  #[test]
  fn two_images_is_8_cents() {
    assert_eq!(cost_for(FluxPro11NumImages::Two).cost_in_usd_cents, Some(8));
  }

  #[test]
  fn three_images_is_12_cents() {
    assert_eq!(cost_for(FluxPro11NumImages::Three).cost_in_usd_cents, Some(12));
  }

  #[test]
  fn four_images_is_16_cents() {
    assert_eq!(cost_for(FluxPro11NumImages::Four).cost_in_usd_cents, Some(16));
  }

  #[test]
  fn credits_equal_cents() {
    // v1 set cost_in_credits to the same USD cents value; preserve that.
    let cost = cost_for(FluxPro11NumImages::Two);
    assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
  }

  #[test]
  fn cost_flags_match_v1() {
    let cost = cost_for(FluxPro11NumImages::One);
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
    assert!(cost.failures_are_refunded.is_none());
  }
}
