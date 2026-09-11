use crate::requests::api::mesh::text::hunyuan_3d_3p1_pro_text_to_mesh::api::Hunyuan3d3p1ProTextToMeshRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Hunyuan3d3p1ProTextToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/pro/text-to-3d):
    //   "Your request will cost $0.375 per generation. Enabling PBR materials
    //    adds $0.15. Using multi-view images adds $0.15. Custom face count
    //    adds $0.15."
    //
    // Base: $0.375 → 38¢ (rounded up). Unlike v3, the v3.1 pro pricing has no
    // per-generation-type price deltas — Geometry bills the same base.
    // Text-to-3d has no image inputs, so no multi-view add-on here.
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
  use crate::requests::api::mesh::text::hunyuan_3d_3p1_pro_text_to_mesh::api::Hunyuan3d3p1ProTextToMeshGenerateType;

  fn base_request() -> Hunyuan3d3p1ProTextToMeshRequest {
    Hunyuan3d3p1ProTextToMeshRequest {
      prompt: "p".to_string(),
      generate_type: None,
      face_count: None,
      enable_pbr: None,
    }
  }

  #[test]
  fn base_cost() {
    assert_eq!(base_request().calculate_cost_in_cents(), 38);
  }

  #[test]
  fn generate_type_does_not_change_cost() {
    for t in [
      Hunyuan3d3p1ProTextToMeshGenerateType::Normal,
      Hunyuan3d3p1ProTextToMeshGenerateType::Geometry,
    ] {
      let mut req = base_request();
      req.generate_type = Some(t);
      assert_eq!(req.calculate_cost_in_cents(), 38);
    }
  }

  #[test]
  fn pbr_adds_fifteen() {
    let mut req = base_request();
    req.enable_pbr = Some(true);
    assert_eq!(req.calculate_cost_in_cents(), 38 + 15);
  }

  #[test]
  fn face_count_adds_fifteen() {
    let mut req = base_request();
    req.face_count = Some(50_000);
    assert_eq!(req.calculate_cost_in_cents(), 38 + 15);
  }

  #[test]
  fn add_ons_stack() {
    let mut req = base_request();
    req.enable_pbr = Some(true);
    req.face_count = Some(100_000);
    assert_eq!(req.calculate_cost_in_cents(), 38 + 15 + 15);
  }
}
