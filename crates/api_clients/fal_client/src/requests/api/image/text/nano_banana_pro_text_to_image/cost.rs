use crate::requests::api::image::text::nano_banana_pro_text_to_image::api::{
  NanoBananaProTextToImageNumImages, NanoBananaProTextToImageRequest,
  NanoBananaProTextToImageResolution,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for NanoBananaProTextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Your request will cost $0.15 per image.
    // 4K outputs will be charged at double the standard rate.
    let base_cost = match self.resolution {
      None => 15,
      Some(NanoBananaProTextToImageResolution::OneK) => 15,
      Some(NanoBananaProTextToImageResolution::TwoK) => 15,
      Some(NanoBananaProTextToImageResolution::FourK) => 30,
    };
    let cost = match self.num_images {
      NanoBananaProTextToImageNumImages::One => base_cost,
      NanoBananaProTextToImageNumImages::Two => base_cost * 2,
      NanoBananaProTextToImageNumImages::Three => base_cost * 3,
      NanoBananaProTextToImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: NanoBananaProTextToImageNumImages,
    resolution: Option<NanoBananaProTextToImageResolution>,
  ) -> NanoBananaProTextToImageRequest {
    NanoBananaProTextToImageRequest {
      prompt: "test".to_string(),
      num_images,
      resolution,
      aspect_ratio: None,
    }
  }

  #[test]
  fn cost_default_resolution_one_image() {
    assert_eq!(make_request(NanoBananaProTextToImageNumImages::One, None).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_one_k_one_image() {
    assert_eq!(make_request(NanoBananaProTextToImageNumImages::One, Some(NanoBananaProTextToImageResolution::OneK)).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_two_k_one_image() {
    assert_eq!(make_request(NanoBananaProTextToImageNumImages::One, Some(NanoBananaProTextToImageResolution::TwoK)).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_four_k_one_image() {
    assert_eq!(make_request(NanoBananaProTextToImageNumImages::One, Some(NanoBananaProTextToImageResolution::FourK)).calculate_cost_in_cents(), 30);
  }

  #[test]
  fn cost_one_k_four_images() {
    assert_eq!(make_request(NanoBananaProTextToImageNumImages::Four, Some(NanoBananaProTextToImageResolution::OneK)).calculate_cost_in_cents(), 60);
  }

  #[test]
  fn cost_four_k_two_images() {
    assert_eq!(make_request(NanoBananaProTextToImageNumImages::Two, Some(NanoBananaProTextToImageResolution::FourK)).calculate_cost_in_cents(), 60);
  }
}
