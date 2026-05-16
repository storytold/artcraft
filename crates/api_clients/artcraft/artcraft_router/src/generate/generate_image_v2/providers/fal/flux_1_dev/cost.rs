use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::flux_1_dev::request::FalFlux1DevRequestState;

pub struct FalFlux1DevCostState {
  cost_in_usd_cents: u64,
}

impl FalFlux1DevCostState {
  pub fn from_request(request: &FalFlux1DevRequestState) -> Self {
    let cost_in_usd_cents = match request {
      FalFlux1DevRequestState::TextToImage(req) => req.calculate_cost_in_cents(),
      FalFlux1DevRequestState::EditImage(req) => req.calculate_cost_in_cents(),
    };
    Self { cost_in_usd_cents }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    ImageGenerationCostEstimate {
      cost_in_credits: None,
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
  use fal_client::requests::api::image::edit::flux_1_dev_edit_image::api::{
    Flux1DevEditImageNumImages, Flux1DevEditImageRequest,
  };
  use fal_client::requests::api::image::text::flux_1_dev_text_to_image::api::{
    Flux1DevTextToImageAspectRatio, Flux1DevTextToImageNumImages, Flux1DevTextToImageRequest,
  };

  mod text_to_image_costs {
    use super::*;

    fn make_t2i(num_images: Flux1DevTextToImageNumImages) -> FalFlux1DevRequestState {
      FalFlux1DevRequestState::TextToImage(Flux1DevTextToImageRequest {
        prompt: "test".to_string(),
        num_images,
        aspect_ratio: Flux1DevTextToImageAspectRatio::Square,
      })
    }

    #[test]
    fn one_image() {
      let cost = FalFlux1DevCostState::from_request(&make_t2i(Flux1DevTextToImageNumImages::One));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(3));
    }

    #[test]
    fn two_images() {
      let cost = FalFlux1DevCostState::from_request(&make_t2i(Flux1DevTextToImageNumImages::Two));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(6));
    }

    #[test]
    fn four_images() {
      let cost = FalFlux1DevCostState::from_request(&make_t2i(Flux1DevTextToImageNumImages::Four));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(12));
    }
  }

  mod edit_image_costs {
    use super::*;

    fn make_edit(num_images: Flux1DevEditImageNumImages) -> FalFlux1DevRequestState {
      FalFlux1DevRequestState::EditImage(Flux1DevEditImageRequest {
        prompt: "test".to_string(),
        image_url: "https://example.com/img.jpg".to_string(),
        num_images,
      })
    }

    #[test]
    fn one_image() {
      let cost = FalFlux1DevCostState::from_request(&make_edit(Flux1DevEditImageNumImages::One));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(3));
    }

    #[test]
    fn three_images() {
      let cost = FalFlux1DevCostState::from_request(&make_edit(Flux1DevEditImageNumImages::Three));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(9));
    }
  }

  #[test]
  fn cost_flags_are_correct() {
    let state = FalFlux1DevCostState::from_request(
      &FalFlux1DevRequestState::TextToImage(Flux1DevTextToImageRequest {
        prompt: "test".to_string(),
        num_images: Flux1DevTextToImageNumImages::One,
        aspect_ratio: Flux1DevTextToImageAspectRatio::Square,
      }),
    );
    let cost = state.estimate_cost();
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
    assert!(cost.cost_in_credits.is_none());
  }
}
