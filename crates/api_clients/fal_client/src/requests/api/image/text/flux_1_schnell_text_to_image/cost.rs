use crate::requests::api::image::text::flux_1_schnell_text_to_image::api::{
  Flux1SchnellTextToImageAspectRatio, Flux1SchnellTextToImageNumImages,
  Flux1SchnellTextToImageRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Flux1SchnellTextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.003 per megapixel.
    // For a 1024x1024 image (~1 MP), that's less than 1 cent per image.
    // We round up to 1 cent per image.
    let unit_cost = 1;
    let cost = match self.num_images {
      Flux1SchnellTextToImageNumImages::One => unit_cost,
      Flux1SchnellTextToImageNumImages::Two => unit_cost * 2,
      Flux1SchnellTextToImageNumImages::Three => unit_cost * 3,
      Flux1SchnellTextToImageNumImages::Four => unit_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(num_images: Flux1SchnellTextToImageNumImages) -> Flux1SchnellTextToImageRequest {
    Flux1SchnellTextToImageRequest {
      prompt: "test".to_string(),
      aspect_ratio: Flux1SchnellTextToImageAspectRatio::Square,
      num_images,
    }
  }

  #[test]
  fn cost_one_image() {
    assert_eq!(make_request(Flux1SchnellTextToImageNumImages::One).calculate_cost_in_cents(), 1);
  }

  #[test]
  fn cost_two_images() {
    assert_eq!(make_request(Flux1SchnellTextToImageNumImages::Two).calculate_cost_in_cents(), 2);
  }

  #[test]
  fn cost_three_images() {
    assert_eq!(make_request(Flux1SchnellTextToImageNumImages::Three).calculate_cost_in_cents(), 3);
  }

  #[test]
  fn cost_four_images() {
    assert_eq!(make_request(Flux1SchnellTextToImageNumImages::Four).calculate_cost_in_cents(), 4);
  }
}
