use crate::requests::api::mesh::topology::hunyuan_3d_3p1_smart_topology::api::Hunyuan3d3p1SmartTopologyRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Hunyuan3d3p1SmartTopologyRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/smart-topology):
    //   "Your request will cost $0.75 per generation."
    75
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::mesh::topology::hunyuan_3d_3p1_smart_topology::api::{
    Hunyuan3d3p1SmartTopologyFaceLevel, Hunyuan3d3p1SmartTopologyPolygonType,
  };

  #[test]
  fn flat_cost_regardless_of_options() {
    let mut request = Hunyuan3d3p1SmartTopologyRequest {
      input_file_url: "https://example.com/model.glb".to_string(),
      input_file_type: None,
      polygon_type: None,
      face_level: None,
    };
    assert_eq!(request.calculate_cost_in_cents(), 75);

    request.polygon_type = Some(Hunyuan3d3p1SmartTopologyPolygonType::Quadrilateral);
    request.face_level = Some(Hunyuan3d3p1SmartTopologyFaceLevel::High);
    assert_eq!(request.calculate_cost_in_cents(), 75);
  }
}
