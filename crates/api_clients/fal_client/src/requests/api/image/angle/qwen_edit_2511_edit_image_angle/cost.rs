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
