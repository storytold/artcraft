use crate::requests::api::mesh::text::hunyuan3d_3_text_to_mesh::api::{
  Hunyuan3d3TextToMeshGenerateType, Hunyuan3d3TextToMeshRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Hunyuan3d3TextToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Base cost by generation type:
    //   Normal:   $0.375 → 38¢ (rounded up)
    //   LowPoly:  $0.45  → 45¢
    //   Geometry: $0.225 → 23¢ (rounded up)
    //
    // Add-ons (each +$0.15 = 15¢):
    //   - PBR materials enabled
    //   - Custom face count specified
    //
    // Note: text-to-mesh has no multi-view add-on (no image inputs).
    let mut cost: u64 = match self.generate_type {
      None => 38,
      Some(Hunyuan3d3TextToMeshGenerateType::Normal) => 38,
      Some(Hunyuan3d3TextToMeshGenerateType::Geometry) => 23,
      Some(Hunyuan3d3TextToMeshGenerateType::LowPoly) => 45,
    };
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

  fn base_request() -> Hunyuan3d3TextToMeshRequest {
    Hunyuan3d3TextToMeshRequest {
      prompt: "test".to_string(),
      face_count: None,
      generate_type: None,
      polygon_type: None,
      enable_pbr: None,
    }
  }

  mod base_costs {
    use super::*;

    #[test]
    fn default_generate_type() {
      assert_eq!(base_request().calculate_cost_in_cents(), 38);
    }

    #[test]
    fn normal() {
      let mut req = base_request();
      req.generate_type = Some(Hunyuan3d3TextToMeshGenerateType::Normal);
      assert_eq!(req.calculate_cost_in_cents(), 38);
    }

    #[test]
    fn low_poly() {
      let mut req = base_request();
      req.generate_type = Some(Hunyuan3d3TextToMeshGenerateType::LowPoly);
      assert_eq!(req.calculate_cost_in_cents(), 45);
    }

    #[test]
    fn geometry() {
      let mut req = base_request();
      req.generate_type = Some(Hunyuan3d3TextToMeshGenerateType::Geometry);
      assert_eq!(req.calculate_cost_in_cents(), 23);
    }
  }

  mod add_ons {
    use super::*;

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
      req.generate_type = Some(Hunyuan3d3TextToMeshGenerateType::LowPoly);
      req.enable_pbr = Some(true);
      req.face_count = Some(100_000);
      // LowPoly(45) + PBR(15) + face_count(15) = 75
      assert_eq!(req.calculate_cost_in_cents(), 75);
    }

    #[test]
    fn geometry_with_all_add_ons() {
      let mut req = base_request();
      req.generate_type = Some(Hunyuan3d3TextToMeshGenerateType::Geometry);
      req.enable_pbr = Some(true);
      req.face_count = Some(10_000);
      // Geometry(23) + PBR(15) + face_count(15) = 53
      assert_eq!(req.calculate_cost_in_cents(), 53);
    }
  }
}
