use crate::requests::api::image::edit::nano_banana_2_edit_image::api::{
  NanoBanana2EditImageNumImages, NanoBanana2EditImageRequest, NanoBanana2EditImageResolution,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for NanoBanana2EditImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // TODO(bt): Verify actual pricing for Nano Banana 2 edit on fal.ai.
    // 4K outputs may be charged at double the standard rate.
    let base_cost = match self.resolution {
      None => 15,
      Some(NanoBanana2EditImageResolution::HalfK) => 8,
      Some(NanoBanana2EditImageResolution::OneK) => 15,
      Some(NanoBanana2EditImageResolution::TwoK) => 15,
      Some(NanoBanana2EditImageResolution::FourK) => 30,
    };
    let cost = match self.num_images {
      NanoBanana2EditImageNumImages::One => base_cost,
      NanoBanana2EditImageNumImages::Two => base_cost * 2,
      NanoBanana2EditImageNumImages::Three => base_cost * 3,
      NanoBanana2EditImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: NanoBanana2EditImageNumImages,
    resolution: Option<NanoBanana2EditImageResolution>,
  ) -> NanoBanana2EditImageRequest {
    NanoBanana2EditImageRequest {
      prompt: "test".to_string(),
      image_urls: vec!["https://example.com/image.jpg".to_string()],
      num_images,
      resolution,
      aspect_ratio: None,
    }
  }

  #[test]
  fn cost_default_resolution_one_image() {
    assert_eq!(make_request(NanoBanana2EditImageNumImages::One, None).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_half_k_one_image() {
    assert_eq!(make_request(NanoBanana2EditImageNumImages::One, Some(NanoBanana2EditImageResolution::HalfK)).calculate_cost_in_cents(), 8);
  }

  #[test]
  fn cost_one_k_one_image() {
    assert_eq!(make_request(NanoBanana2EditImageNumImages::One, Some(NanoBanana2EditImageResolution::OneK)).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_two_k_one_image() {
    assert_eq!(make_request(NanoBanana2EditImageNumImages::One, Some(NanoBanana2EditImageResolution::TwoK)).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_four_k_one_image() {
    assert_eq!(make_request(NanoBanana2EditImageNumImages::One, Some(NanoBanana2EditImageResolution::FourK)).calculate_cost_in_cents(), 30);
  }

  #[test]
  fn cost_one_k_four_images() {
    assert_eq!(make_request(NanoBanana2EditImageNumImages::Four, Some(NanoBanana2EditImageResolution::OneK)).calculate_cost_in_cents(), 60);
  }

  #[test]
  fn cost_four_k_two_images() {
    assert_eq!(make_request(NanoBanana2EditImageNumImages::Two, Some(NanoBanana2EditImageResolution::FourK)).calculate_cost_in_cents(), 60);
  }
}
