use crate::requests::api::image::edit::nano_banana_pro_edit_image::api::{
  NanoBananaProEditImageNumImages, NanoBananaProEditImageRequest,
  NanoBananaProEditImageResolution,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for NanoBananaProEditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Your request will cost $0.15 per image.
    // 4K outputs will be charged at double the standard rate.
    let base_cost = match self.resolution {
      None => 15,
      Some(NanoBananaProEditImageResolution::OneK) => 15,
      Some(NanoBananaProEditImageResolution::TwoK) => 15,
      Some(NanoBananaProEditImageResolution::FourK) => 30,
    };
    let cost = match self.num_images {
      NanoBananaProEditImageNumImages::One => base_cost,
      NanoBananaProEditImageNumImages::Two => base_cost * 2,
      NanoBananaProEditImageNumImages::Three => base_cost * 3,
      NanoBananaProEditImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: NanoBananaProEditImageNumImages,
    resolution: Option<NanoBananaProEditImageResolution>,
  ) -> NanoBananaProEditImageRequest {
    NanoBananaProEditImageRequest {
      prompt: "test".to_string(),
      image_urls: vec!["https://example.com/image.jpg".to_string()],
      num_images,
      resolution,
      aspect_ratio: None,
    }
  }

  #[test]
  fn cost_default_resolution_one_image() {
    assert_eq!(make_request(NanoBananaProEditImageNumImages::One, None).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_one_k_one_image() {
    assert_eq!(make_request(NanoBananaProEditImageNumImages::One, Some(NanoBananaProEditImageResolution::OneK)).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_two_k_one_image() {
    assert_eq!(make_request(NanoBananaProEditImageNumImages::One, Some(NanoBananaProEditImageResolution::TwoK)).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_four_k_one_image() {
    assert_eq!(make_request(NanoBananaProEditImageNumImages::One, Some(NanoBananaProEditImageResolution::FourK)).calculate_cost_in_cents(), 30);
  }

  #[test]
  fn cost_one_k_four_images() {
    assert_eq!(make_request(NanoBananaProEditImageNumImages::Four, Some(NanoBananaProEditImageResolution::OneK)).calculate_cost_in_cents(), 60);
  }

  #[test]
  fn cost_four_k_two_images() {
    assert_eq!(make_request(NanoBananaProEditImageNumImages::Two, Some(NanoBananaProEditImageResolution::FourK)).calculate_cost_in_cents(), 60);
  }
}
