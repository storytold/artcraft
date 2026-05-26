use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::fal::flux_1_schnell::request::FalFlux1SchnellRequestState;

pub struct FalFlux1SchnellCostState {
  cost_in_usd_cents: u64,
}

impl FalFlux1SchnellCostState {
  pub fn from_request(request: &FalFlux1SchnellRequestState) -> Self {
    let cost_in_usd_cents = match request {
      FalFlux1SchnellRequestState::TextToImage(req) => req.calculate_cost_in_cents(),
      FalFlux1SchnellRequestState::EditImage(req) => req.calculate_cost_in_cents(),
    };
    Self { cost_in_usd_cents }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    ImageGenerationCostEstimate {
      // v1 sets cost_in_credits to the same value as USD cents (1:1).
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
  use fal_client::requests::api::image::edit::flux_1_schnell_edit_image::api::{
    Flux1SchnellEditImageNumImages, Flux1SchnellEditImageRequest,
  };
  use fal_client::requests::api::image::text::flux_1_schnell_text_to_image::api::{
    Flux1SchnellTextToImageAspectRatio, Flux1SchnellTextToImageNumImages,
    Flux1SchnellTextToImageRequest,
  };

  mod text_to_image_costs {
    use super::*;

    fn make_t2i(num_images: Flux1SchnellTextToImageNumImages) -> FalFlux1SchnellRequestState {
      FalFlux1SchnellRequestState::TextToImage(Flux1SchnellTextToImageRequest {
        prompt: "test".to_string(),
        num_images,
        aspect_ratio: Flux1SchnellTextToImageAspectRatio::Square,
      })
    }

    #[test]
    fn one_image() {
      let cost = FalFlux1SchnellCostState::from_request(&make_t2i(Flux1SchnellTextToImageNumImages::One));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(1));
    }

    #[test]
    fn two_images() {
      let cost = FalFlux1SchnellCostState::from_request(&make_t2i(Flux1SchnellTextToImageNumImages::Two));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(2));
    }

    #[test]
    fn four_images() {
      let cost = FalFlux1SchnellCostState::from_request(&make_t2i(Flux1SchnellTextToImageNumImages::Four));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(4));
    }
  }

  mod edit_image_costs {
    use super::*;

    fn make_edit(num_images: Flux1SchnellEditImageNumImages) -> FalFlux1SchnellRequestState {
      FalFlux1SchnellRequestState::EditImage(Flux1SchnellEditImageRequest {
        image_url: "https://example.com/img.jpg".to_string(),
        num_images,
        image_size: None,
      })
    }

    #[test]
    fn one_image() {
      let cost = FalFlux1SchnellCostState::from_request(&make_edit(Flux1SchnellEditImageNumImages::One));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(1));
    }

    #[test]
    fn three_images() {
      let cost = FalFlux1SchnellCostState::from_request(&make_edit(Flux1SchnellEditImageNumImages::Three));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(3));
    }
  }

  #[test]
  fn cost_flags_are_correct() {
    let state = FalFlux1SchnellCostState::from_request(
      &FalFlux1SchnellRequestState::TextToImage(Flux1SchnellTextToImageRequest {
        prompt: "test".to_string(),
        num_images: Flux1SchnellTextToImageNumImages::One,
        aspect_ratio: Flux1SchnellTextToImageAspectRatio::Square,
      }),
    );
    let cost = state.estimate_cost();
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
    assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
  }
}
