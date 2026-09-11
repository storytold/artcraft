use crate::requests::api::splat::image::triposplat_image_to_splat::api::TripoSplatImageToSplatRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for TripoSplatImageToSplatRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/tripo3d/triposplat):
    //   "Price: $0.05 per generations"
    5
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::splat::image::triposplat_image_to_splat::api::TripoSplatOutputFormat;

  fn base_request() -> TripoSplatImageToSplatRequest {
    TripoSplatImageToSplatRequest {
      image_url: "https://example.com/input.png".to_string(),
      num_gaussians: None,
      num_inference_steps: None,
      guidance_scale: None,
      output_format: None,
      seed: None,
      enable_safety_checker: None,
    }
  }

  #[test]
  fn flat_five_cents() {
    assert_eq!(base_request().calculate_cost_in_cents(), 5);
  }

  #[test]
  fn options_do_not_change_cost() {
    let request = TripoSplatImageToSplatRequest {
      num_gaussians: Some(32_768),
      num_inference_steps: Some(50),
      guidance_scale: Some(10.0),
      output_format: Some(TripoSplatOutputFormat::Splat),
      seed: Some(7),
      enable_safety_checker: Some(false),
      ..base_request()
    };
    assert_eq!(request.calculate_cost_in_cents(), 5);
  }
}
