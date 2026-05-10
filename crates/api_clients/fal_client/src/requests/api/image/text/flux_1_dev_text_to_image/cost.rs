use crate::requests::api::image::text::flux_1_dev_text_to_image::api::{
  Flux1DevTextToImageAspectRatio, Flux1DevTextToImageNumImages, Flux1DevTextToImageRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Flux1DevTextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.025 per megapixel.
    // For a 1024x1024 image (~1 MP), that's ~3 cents per image.
    let unit_cost = 3;
    let cost = match self.num_images {
      Flux1DevTextToImageNumImages::One => unit_cost,
      Flux1DevTextToImageNumImages::Two => unit_cost * 2,
      Flux1DevTextToImageNumImages::Three => unit_cost * 3,
      Flux1DevTextToImageNumImages::Four => unit_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(num_images: Flux1DevTextToImageNumImages) -> Flux1DevTextToImageRequest {
    Flux1DevTextToImageRequest {
      prompt: "test".to_string(),
      aspect_ratio: Flux1DevTextToImageAspectRatio::Square,
      num_images,
    }
  }

  #[test]
  fn cost_one_image() {
    assert_eq!(make_request(Flux1DevTextToImageNumImages::One).calculate_cost_in_cents(), 3);
  }

  #[test]
  fn cost_two_images() {
    assert_eq!(make_request(Flux1DevTextToImageNumImages::Two).calculate_cost_in_cents(), 6);
  }

  #[test]
  fn cost_three_images() {
    assert_eq!(make_request(Flux1DevTextToImageNumImages::Three).calculate_cost_in_cents(), 9);
  }

  #[test]
  fn cost_four_images() {
    assert_eq!(make_request(Flux1DevTextToImageNumImages::Four).calculate_cost_in_cents(), 12);
  }
}
