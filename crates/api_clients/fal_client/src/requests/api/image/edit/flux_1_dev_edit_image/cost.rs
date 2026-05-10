use crate::requests::api::image::edit::flux_1_dev_edit_image::api::{
  Flux1DevEditImageNumImages, Flux1DevEditImageRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Flux1DevEditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.025 per megapixel.
    // For a 1024x1024 image (~1 MP), that's ~3 cents per image.
    let unit_cost = 3;
    let cost = match self.num_images {
      Flux1DevEditImageNumImages::One => unit_cost,
      Flux1DevEditImageNumImages::Two => unit_cost * 2,
      Flux1DevEditImageNumImages::Three => unit_cost * 3,
      Flux1DevEditImageNumImages::Four => unit_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(num_images: Flux1DevEditImageNumImages) -> Flux1DevEditImageRequest {
    Flux1DevEditImageRequest {
      prompt: "test".to_string(),
      image_url: "https://example.com/image.jpg".to_string(),
      num_images,
    }
  }

  #[test]
  fn cost_one_image() {
    assert_eq!(make_request(Flux1DevEditImageNumImages::One).calculate_cost_in_cents(), 3);
  }

  #[test]
  fn cost_two_images() {
    assert_eq!(make_request(Flux1DevEditImageNumImages::Two).calculate_cost_in_cents(), 6);
  }

  #[test]
  fn cost_three_images() {
    assert_eq!(make_request(Flux1DevEditImageNumImages::Three).calculate_cost_in_cents(), 9);
  }

  #[test]
  fn cost_four_images() {
    assert_eq!(make_request(Flux1DevEditImageNumImages::Four).calculate_cost_in_cents(), 12);
  }
}
