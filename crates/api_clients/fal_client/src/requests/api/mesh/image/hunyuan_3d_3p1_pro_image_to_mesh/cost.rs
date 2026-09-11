use crate::requests::api::mesh::image::hunyuan_3d_3p1_pro_image_to_mesh::api::Hunyuan3d3p1ProImageToMeshRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Hunyuan3d3p1ProImageToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/pro/image-to-3d):
    //   "Your request will cost $0.375 per generation. Enabling PBR materials
    //    adds $0.15. Using multi-view images adds $0.15. Custom face count
    //    adds $0.15."
    //
    // Base: $0.375 → 38¢ (rounded up). Unlike v3, the v3.1 pro pricing has no
    // per-generation-type price deltas — Geometry bills the same base.
    let mut cost: u64 = 38;
    if self.enable_pbr.unwrap_or(false) {
      cost += 15;
    }
    if self.face_count.is_some() {
      cost += 15;
    }
    if self.uses_multi_view() {
      cost += 15;
    }
    cost
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::api::mesh::image::hunyuan_3d_3p1_pro_image_to_mesh::api::Hunyuan3d3p1ProImageToMeshGenerateType;

  fn base_request() -> Hunyuan3d3p1ProImageToMeshRequest {
    Hunyuan3d3p1ProImageToMeshRequest {
      image_url: "https://example.com/front.jpg".to_string(),
      back_image_url: None,
      left_image_url: None,
      right_image_url: None,
      top_image_url: None,
      bottom_image_url: None,
      left_front_image_url: None,
      right_front_image_url: None,
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
      Hunyuan3d3p1ProImageToMeshGenerateType::Normal,
      Hunyuan3d3p1ProImageToMeshGenerateType::Geometry,
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
  fn any_extra_view_adds_fifteen_once() {
    // v3.1-exclusive views must also trigger the multi-view add-on.
    let mut req = base_request();
    req.top_image_url = Some("https://example.com/top.jpg".to_string());
    assert_eq!(req.calculate_cost_in_cents(), 38 + 15);

    // Stacking more views doesn't add more.
    req.back_image_url = Some("https://example.com/back.jpg".to_string());
    req.left_front_image_url = Some("https://example.com/lf.jpg".to_string());
    assert_eq!(req.calculate_cost_in_cents(), 38 + 15);
  }

  #[test]
  fn all_add_ons_stack() {
    let mut req = base_request();
    req.enable_pbr = Some(true);
    req.face_count = Some(100_000);
    req.right_front_image_url = Some("https://example.com/rf.jpg".to_string());
    // 38 + 15 + 15 + 15 = 83
    assert_eq!(req.calculate_cost_in_cents(), 83);
  }
}
