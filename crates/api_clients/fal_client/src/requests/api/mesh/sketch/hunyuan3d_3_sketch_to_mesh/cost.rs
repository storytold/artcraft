use crate::requests::api::mesh::sketch::hunyuan3d_3_sketch_to_mesh::api::Hunyuan3d3SketchToMeshRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Hunyuan3d3SketchToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/hunyuan3d-v3/sketch-to-3d):
    //   "Your request will cost $0.375 per generation."
    //
    // Base: $0.375 → 38¢ (rounded up). Sketch-to-3d has no generate_type
    // parameter, so the LowPoly/Geometry prices of the other v3 endpoints
    // do not apply here.
    //
    // Add-ons (each +$0.15 = 15¢):
    //   - PBR materials enabled
    //   - Custom face count specified
    let mut cost: u64 = 38;
    if self.enable_pbr.unwrap_or(false) {
      cost += 15;
    }
    if self.face_count.is_some() {
      cost += 15;
    }
    cost
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  mod cost_table {
    use super::*;

    #[test]
    fn base_cost() {
      assert_eq!(base_request().calculate_cost_in_cents(), 38);
    }

    #[test]
    fn pbr_adds_fifteen() {
      let mut req = base_request();
      req.enable_pbr = Some(true);
      assert_eq!(req.calculate_cost_in_cents(), 38 + 15);
    }

    #[test]
    fn pbr_false_no_extra() {
      let mut req = base_request();
      req.enable_pbr = Some(false);
      assert_eq!(req.calculate_cost_in_cents(), 38);
    }

    #[test]
    fn face_count_adds_fifteen() {
      let mut req = base_request();
      req.face_count = Some(50_000);
      assert_eq!(req.calculate_cost_in_cents(), 38 + 15);
    }

    #[test]
    fn all_add_ons_stack() {
      let mut req = base_request();
      req.enable_pbr = Some(true);
      req.face_count = Some(100_000);
      // Base(38) + PBR(15) + face_count(15) = 68
      assert_eq!(req.calculate_cost_in_cents(), 68);
    }
  }

  fn base_request() -> Hunyuan3d3SketchToMeshRequest {
    Hunyuan3d3SketchToMeshRequest {
      image_url: "https://example.com/sketch.png".to_string(),
      prompt: "test".to_string(),
      face_count: None,
      enable_pbr: None,
    }
  }
}
