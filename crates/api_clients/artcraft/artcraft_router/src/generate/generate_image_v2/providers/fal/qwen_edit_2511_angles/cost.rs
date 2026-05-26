use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::qwen_edit_2511_angles::request::FalQwenEdit2511AnglesRequestState;

/// Cost state for Fal Qwen Edit 2511 Angles. Delegates to the fal_client
/// cost calculator (4¢ per output image — $0.035/MP at the default ~1MP).
pub struct FalQwenEdit2511AnglesCostState {
  cost_in_usd_cents: u64,
}

impl FalQwenEdit2511AnglesCostState {
  pub fn from_request(request: &FalQwenEdit2511AnglesRequestState) -> Self {
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
  use fal_client::requests::webhook::image::angle::enqueue_qwen_edit_2511_edit_image_angle_webhook::{
    EnqueueQwenEdit2511AngleNumImages, EnqueueQwenEdit2511EditImageAngleRequest,
  };

  fn cost_for(n: EnqueueQwenEdit2511AngleNumImages) -> ImageGenerationCostEstimate {
    let state = FalQwenEdit2511AnglesCostState::from_request(&FalQwenEdit2511AnglesRequestState {
      request: EnqueueQwenEdit2511EditImageAngleRequest {
        image_urls: vec!["https://example.com/x.jpg".to_string()],
        horizontal_angle: None,
        vertical_angle: None,
        zoom: None,
        additional_prompt: None,
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
  fn one_image_is_4_cents() {
    assert_eq!(cost_for(EnqueueQwenEdit2511AngleNumImages::One).cost_in_usd_cents, Some(4));
  }

  #[test]
  fn two_images_is_8_cents() {
    assert_eq!(cost_for(EnqueueQwenEdit2511AngleNumImages::Two).cost_in_usd_cents, Some(8));
  }

  #[test]
  fn three_images_is_12_cents() {
    assert_eq!(cost_for(EnqueueQwenEdit2511AngleNumImages::Three).cost_in_usd_cents, Some(12));
  }

  #[test]
  fn four_images_is_16_cents() {
    assert_eq!(cost_for(EnqueueQwenEdit2511AngleNumImages::Four).cost_in_usd_cents, Some(16));
  }

  #[test]
  fn credits_equal_cents() {
    let cost = cost_for(EnqueueQwenEdit2511AngleNumImages::Two);
    assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
  }
}
