use crate::requests::api::image::angle::flux_2_lora_edit_image_angle::api::{Flux2LoraAngleNumImages, Flux2LoraEditImageAngleRequest};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Flux2LoraEditImageAngleRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.021 per megapixel.
    // For a 1024x1024 image (~1 MP), that's ~2 cents per image.
    let unit_cost = 2;
    let cost = match self.num_images {
      None => unit_cost,
      Some(Flux2LoraAngleNumImages::One) => unit_cost,
      Some(Flux2LoraAngleNumImages::Two) => unit_cost * 2,
      Some(Flux2LoraAngleNumImages::Three) => unit_cost * 3,
      Some(Flux2LoraAngleNumImages::Four) => unit_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(num_images: Option<Flux2LoraAngleNumImages>) -> Flux2LoraEditImageAngleRequest {
    Flux2LoraEditImageAngleRequest {
      image_urls: vec!["https://example.com/image.jpg".to_string()],
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      num_images,
      image_size: None,
      lora_scale: None,
      guidance_scale: None,
      num_inference_steps: None,
    }
  }

  #[test]
  fn cost_default_one_image() {
    assert_eq!(make_request(None).calculate_cost_in_cents(), 2);
  }

  #[test]
  fn cost_one_image() {
    assert_eq!(make_request(Some(Flux2LoraAngleNumImages::One)).calculate_cost_in_cents(), 2);
  }

  #[test]
  fn cost_two_images() {
    assert_eq!(make_request(Some(Flux2LoraAngleNumImages::Two)).calculate_cost_in_cents(), 4);
  }

  #[test]
  fn cost_three_images() {
    assert_eq!(make_request(Some(Flux2LoraAngleNumImages::Three)).calculate_cost_in_cents(), 6);
  }

  #[test]
  fn cost_four_images() {
    assert_eq!(make_request(Some(Flux2LoraAngleNumImages::Four)).calculate_cost_in_cents(), 8);
  }
}
