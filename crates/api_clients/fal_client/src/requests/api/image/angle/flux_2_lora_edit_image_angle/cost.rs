use crate::requests::api::image::angle::flux_2_lora_edit_image_angle::binding::{Flux2LoraAngleNumImages, Flux2LoraEditImageAngleRequest};
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
