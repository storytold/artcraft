use crate::requests::api::image::edit::flux_1_schnell_edit_image::api::{
  Flux1SchnellEditImageNumImages, Flux1SchnellEditImageRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Flux1SchnellEditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.003 per megapixel.
    // For a 1024x1024 image (~1 MP), that's less than 1 cent per image.
    // We round up to 1 cent per image.
    let unit_cost = 1;
    let cost = match self.num_images {
      Flux1SchnellEditImageNumImages::One => unit_cost,
      Flux1SchnellEditImageNumImages::Two => unit_cost * 2,
      Flux1SchnellEditImageNumImages::Three => unit_cost * 3,
      Flux1SchnellEditImageNumImages::Four => unit_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(num_images: Flux1SchnellEditImageNumImages) -> Flux1SchnellEditImageRequest {
    Flux1SchnellEditImageRequest {
      image_url: "https://example.com/image.jpg".to_string(),
      num_images,
      image_size: None,
    }
  }

  #[test]
  fn cost_one_image() {
    assert_eq!(make_request(Flux1SchnellEditImageNumImages::One).calculate_cost_in_cents(), 1);
  }

  #[test]
  fn cost_two_images() {
    assert_eq!(make_request(Flux1SchnellEditImageNumImages::Two).calculate_cost_in_cents(), 2);
  }

  #[test]
  fn cost_three_images() {
    assert_eq!(make_request(Flux1SchnellEditImageNumImages::Three).calculate_cost_in_cents(), 3);
  }

  #[test]
  fn cost_four_images() {
    assert_eq!(make_request(Flux1SchnellEditImageNumImages::Four).calculate_cost_in_cents(), 4);
  }
}
