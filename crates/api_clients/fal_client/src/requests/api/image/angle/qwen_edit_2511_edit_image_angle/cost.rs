use crate::requests::api::image::angle::qwen_edit_2511_edit_image_angle::api::{
  QwenEdit2511AngleNumImages, QwenEdit2511EditImageAngleRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for QwenEdit2511EditImageAngleRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.035 per megapixel.
    // For a 1024x1024 image (~1 MP), that's ~4 cents per image.
    let unit_cost = 4;
    let cost = match self.num_images {
      None => unit_cost,
      Some(QwenEdit2511AngleNumImages::One) => unit_cost,
      Some(QwenEdit2511AngleNumImages::Two) => unit_cost * 2,
      Some(QwenEdit2511AngleNumImages::Three) => unit_cost * 3,
      Some(QwenEdit2511AngleNumImages::Four) => unit_cost * 4,
    };
    cost as UsdCents
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn cost_default_one_image() {
    let request = QwenEdit2511EditImageAngleRequest {
      image_urls: vec!["https://example.com/image.jpg".to_string()],
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      additional_prompt: None,
      num_images: None,
      image_size: None,
      lora_scale: None,
      guidance_scale: None,
      num_inference_steps: None,
    };
    assert_eq!(request.calculate_cost_in_cents(), 4);
  }

  #[test]
  fn cost_one_image() {
    let request = QwenEdit2511EditImageAngleRequest {
      image_urls: vec!["https://example.com/image.jpg".to_string()],
      horizontal_angle: Some(45.0),
      vertical_angle: Some(15.0),
      zoom: Some(5.0),
      additional_prompt: None,
      num_images: Some(QwenEdit2511AngleNumImages::One),
      image_size: None,
      lora_scale: None,
      guidance_scale: None,
      num_inference_steps: None,
    };
    assert_eq!(request.calculate_cost_in_cents(), 4);
  }

  #[test]
  fn cost_four_images() {
    let request = QwenEdit2511EditImageAngleRequest {
      image_urls: vec!["https://example.com/image.jpg".to_string()],
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      additional_prompt: None,
      num_images: Some(QwenEdit2511AngleNumImages::Four),
      image_size: None,
      lora_scale: None,
      guidance_scale: None,
      num_inference_steps: None,
    };
    assert_eq!(request.calculate_cost_in_cents(), 16);
  }
}
