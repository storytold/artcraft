use crate::requests::api::image::text::nano_banana_2_text_to_image::api::{
  NanoBanana2TextToImageNumImages, NanoBanana2TextToImageRequest,
  NanoBanana2TextToImageResolution,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for NanoBanana2TextToImageRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // TODO(bt): Verify actual pricing for Nano Banana 2 on fal.ai.
    // 4K outputs may be charged at double the standard rate.
    let base_cost = match self.resolution {
      None => 15,
      Some(NanoBanana2TextToImageResolution::HalfK) => 8,
      Some(NanoBanana2TextToImageResolution::OneK) => 15,
      Some(NanoBanana2TextToImageResolution::TwoK) => 15,
      Some(NanoBanana2TextToImageResolution::FourK) => 30,
    };
    let cost = match self.num_images {
      NanoBanana2TextToImageNumImages::One => base_cost,
      NanoBanana2TextToImageNumImages::Two => base_cost * 2,
      NanoBanana2TextToImageNumImages::Three => base_cost * 3,
      NanoBanana2TextToImageNumImages::Four => base_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn make_request(
    num_images: NanoBanana2TextToImageNumImages,
    resolution: Option<NanoBanana2TextToImageResolution>,
  ) -> NanoBanana2TextToImageRequest {
    NanoBanana2TextToImageRequest {
      prompt: "test".to_string(),
      num_images,
      resolution,
      aspect_ratio: None,
    }
  }

  #[test]
  fn cost_default_resolution_one_image() {
    assert_eq!(make_request(NanoBanana2TextToImageNumImages::One, None).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_half_k_one_image() {
    assert_eq!(make_request(NanoBanana2TextToImageNumImages::One, Some(NanoBanana2TextToImageResolution::HalfK)).calculate_cost_in_cents(), 8);
  }

  #[test]
  fn cost_one_k_one_image() {
    assert_eq!(make_request(NanoBanana2TextToImageNumImages::One, Some(NanoBanana2TextToImageResolution::OneK)).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_two_k_one_image() {
    assert_eq!(make_request(NanoBanana2TextToImageNumImages::One, Some(NanoBanana2TextToImageResolution::TwoK)).calculate_cost_in_cents(), 15);
  }

  #[test]
  fn cost_four_k_one_image() {
    assert_eq!(make_request(NanoBanana2TextToImageNumImages::One, Some(NanoBanana2TextToImageResolution::FourK)).calculate_cost_in_cents(), 30);
  }

  #[test]
  fn cost_one_k_four_images() {
    assert_eq!(make_request(NanoBanana2TextToImageNumImages::Four, Some(NanoBanana2TextToImageResolution::OneK)).calculate_cost_in_cents(), 60);
  }

  #[test]
  fn cost_four_k_two_images() {
    assert_eq!(make_request(NanoBanana2TextToImageNumImages::Two, Some(NanoBanana2TextToImageResolution::FourK)).calculate_cost_in_cents(), 60);
  }
}
