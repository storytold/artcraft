use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::flux_2_lora_angles::request::FalFlux2LoraAnglesRequestState;

/// Cost state for Fal Flux 2 LoRA Angles. Delegates to the fal_client cost
/// calculator (2¢ per output image — $0.021/MP at the default ~1MP).
pub struct FalFlux2LoraAnglesCostState {
  cost_in_usd_cents: u64,
}

impl FalFlux2LoraAnglesCostState {
  pub fn from_request(request: &FalFlux2LoraAnglesRequestState) -> Self {
    Self {
      cost_in_usd_cents: request.request.calculate_cost_in_cents(),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
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
  use fal_client::requests::webhook::image::angle::enqueue_flux_2_lora_edit_image_angle_webhook::{
    EnqueueFlux2LoraAngleNumImages, EnqueueFlux2LoraEditImageAngleRequest,
  };

  fn cost_for(n: EnqueueFlux2LoraAngleNumImages) -> ImageGenerationCostEstimate {
    let state = FalFlux2LoraAnglesCostState::from_request(&FalFlux2LoraAnglesRequestState {
      request: EnqueueFlux2LoraEditImageAngleRequest {
        image_urls: vec!["https://example.com/x.jpg".to_string()],
        horizontal_angle: None,
        vertical_angle: None,
        zoom: None,
        num_images: Some(n),
        image_size: None,
        lora_scale: None,
        guidance_scale: None,
        num_inference_steps: None,
      },
    });
    state.estimate_cost()
  }

  #[test]
  fn one_image_is_2_cents() {
    assert_eq!(cost_for(EnqueueFlux2LoraAngleNumImages::One).cost_in_usd_cents, Some(2));
  }

  #[test]
  fn two_images_is_4_cents() {
    assert_eq!(cost_for(EnqueueFlux2LoraAngleNumImages::Two).cost_in_usd_cents, Some(4));
  }

  #[test]
  fn three_images_is_6_cents() {
    assert_eq!(cost_for(EnqueueFlux2LoraAngleNumImages::Three).cost_in_usd_cents, Some(6));
  }

  #[test]
  fn four_images_is_8_cents() {
    assert_eq!(cost_for(EnqueueFlux2LoraAngleNumImages::Four).cost_in_usd_cents, Some(8));
  }
}
