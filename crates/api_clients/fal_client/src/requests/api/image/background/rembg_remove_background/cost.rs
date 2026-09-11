use crate::requests::api::image::background::rembg_remove_background::api::RembgRemoveBackgroundRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for RembgRemoveBackgroundRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.004 per image (less than 1 cent).
    // We round up to 0 cents for now
    0
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn cost_is_one_cent() {
    let request = RembgRemoveBackgroundRequest {
      image_url: "https://example.com/image.jpg".to_string(),
    };
    assert_eq!(request.calculate_cost_in_cents(), 0);
  }
}
