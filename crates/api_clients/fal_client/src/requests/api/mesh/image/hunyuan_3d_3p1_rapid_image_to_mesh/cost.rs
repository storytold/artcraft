use crate::requests::api::mesh::image::hunyuan_3d_3p1_rapid_image_to_mesh::api::Hunyuan3d3p1RapidImageToMeshRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Hunyuan3d3p1RapidImageToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d):
    //   "Base generation (text or image to 3D) costs $0.225. Enabling PBR
    //    materials adds $0.15."
    //
    // Base: $0.225 → 23¢ (rounded up).
    let mut cost: u64 = 23;
    if self.enable_pbr.unwrap_or(false) {
      cost += 15;
    }
    cost
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn base_request() -> Hunyuan3d3p1RapidImageToMeshRequest {
    Hunyuan3d3p1RapidImageToMeshRequest {
      image_url: "https://example.com/front.jpg".to_string(),
      enable_pbr: None,
      enable_geometry: None,
    }
  }

  #[test]
  fn base_cost() {
    assert_eq!(base_request().calculate_cost_in_cents(), 23);
  }

  #[test]
  fn pbr_adds_fifteen() {
    let mut req = base_request();
    req.enable_pbr = Some(true);
    assert_eq!(req.calculate_cost_in_cents(), 23 + 15);
  }

  #[test]
  fn geometry_does_not_change_cost() {
    let mut req = base_request();
    req.enable_geometry = Some(true);
    assert_eq!(req.calculate_cost_in_cents(), 23);
  }
}
