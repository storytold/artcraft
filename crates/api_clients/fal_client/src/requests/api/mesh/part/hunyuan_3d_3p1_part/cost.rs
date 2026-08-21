use crate::requests::api::mesh::part::hunyuan_3d_3p1_part::api::Hunyuan3d3p1PartRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Hunyuan3d3p1PartRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/part):
    //   "Your request will cost $0.45 per generation."
    45
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn flat_cost() {
    let request = Hunyuan3d3p1PartRequest {
      input_file_url: "https://example.com/model.fbx".to_string(),
    };
    assert_eq!(request.calculate_cost_in_cents(), 45);
  }
}
