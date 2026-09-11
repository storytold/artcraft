use crate::requests::api::mesh::image::hunyuan3d_3_image_to_mesh::api::{
  Hunyuan3d3ImageToMeshGenerateType, Hunyuan3d3ImageToMeshRequest,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Hunyuan3d3ImageToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Base cost by generation type:
    //   Normal:   $0.375 → 38¢ (rounded up)
    //   LowPoly:  $0.45  → 45¢
    //   Geometry: $0.225 → 23¢ (rounded up)
    //
    // Add-ons (each +$0.15 = 15¢):
    //   - PBR materials enabled
    //   - Custom face count specified
    //   - Multi-view images (any of back/left/right)
    let mut cost: u64 = match self.generate_type {
      None => 38,
      Some(Hunyuan3d3ImageToMeshGenerateType::Normal) => 38,
      Some(Hunyuan3d3ImageToMeshGenerateType::Geometry) => 23,
      Some(Hunyuan3d3ImageToMeshGenerateType::LowPoly) => 45,
    };
    if self.enable_pbr.unwrap_or(false) {
      cost += 15;
    }
    if self.face_count.is_some() {
      cost += 15;
    }
    let use_multi_view = self.left_image_url.is_some()
      || self.right_image_url.is_some()
      || self.back_image_url.is_some();
    if use_multi_view {
      cost += 15;
    }
    cost
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn base_request() -> Hunyuan3d3ImageToMeshRequest {
    Hunyuan3d3ImageToMeshRequest {
      image_url: "https://example.com/image.jpg".to_string(),
      back_image_url: None,
      left_image_url: None,
      right_image_url: None,
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
      req.generate_type = Some(Hunyuan3d3ImageToMeshGenerateType::Normal);
      assert_eq!(req.calculate_cost_in_cents(), 38);
    }

    #[test]
    fn low_poly() {
      let mut req = base_request();
      req.generate_type = Some(Hunyuan3d3ImageToMeshGenerateType::LowPoly);
      assert_eq!(req.calculate_cost_in_cents(), 45);
    }

    #[test]
    fn geometry() {
      let mut req = base_request();
      req.generate_type = Some(Hunyuan3d3ImageToMeshGenerateType::Geometry);
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
    fn back_image_adds_fifteen() {
      let mut req = base_request();
      req.back_image_url = Some("https://example.com/back.jpg".to_string());
      assert_eq!(req.calculate_cost_in_cents(), 38 + 15);
    }

    #[test]
    fn left_image_adds_fifteen() {
      let mut req = base_request();
      req.left_image_url = Some("https://example.com/left.jpg".to_string());
      assert_eq!(req.calculate_cost_in_cents(), 38 + 15);
    }

    #[test]
    fn right_image_adds_fifteen() {
      let mut req = base_request();
      req.right_image_url = Some("https://example.com/right.jpg".to_string());
      assert_eq!(req.calculate_cost_in_cents(), 38 + 15);
    }

    #[test]
    fn multi_view_only_adds_fifteen_once() {
      let mut req = base_request();
      req.back_image_url = Some("https://example.com/back.jpg".to_string());
      req.left_image_url = Some("https://example.com/left.jpg".to_string());
      req.right_image_url = Some("https://example.com/right.jpg".to_string());
      assert_eq!(req.calculate_cost_in_cents(), 38 + 15);
    }

    #[test]
    fn all_add_ons_stack() {
      let mut req = base_request();
      req.generate_type = Some(Hunyuan3d3ImageToMeshGenerateType::LowPoly);
      req.enable_pbr = Some(true);
      req.face_count = Some(100_000);
      req.back_image_url = Some("https://example.com/back.jpg".to_string());
      // LowPoly(45) + PBR(15) + face_count(15) + multi_view(15) = 90
      assert_eq!(req.calculate_cost_in_cents(), 90);
    }

    #[test]
    fn geometry_with_all_add_ons() {
      let mut req = base_request();
      req.generate_type = Some(Hunyuan3d3ImageToMeshGenerateType::Geometry);
      req.enable_pbr = Some(true);
      req.face_count = Some(10_000);
      req.left_image_url = Some("https://example.com/left.jpg".to_string());
      // Geometry(23) + PBR(15) + face_count(15) + multi_view(15) = 68
      assert_eq!(req.calculate_cost_in_cents(), 68);
    }
  }
}
