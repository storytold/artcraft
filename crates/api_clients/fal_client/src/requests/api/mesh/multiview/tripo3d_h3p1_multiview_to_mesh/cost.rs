use crate::requests::api::mesh::image::tripo3d_h3p1_image_to_mesh::api::{
  Tripo3dH3p1ImageGeometryQuality, Tripo3dH3p1ImageTextureQuality,
};
use crate::requests::api::mesh::multiview::tripo3d_h3p1_multiview_to_mesh::api::Tripo3dH3p1MultiviewToMeshRequest;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Tripo3dH3p1MultiviewToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/tripo3d/h3.1/multiview-to-3d):
    //   "Your request will cost $0.10 (without textures), $0.20 (with standard
    //    textures), or $0.30 (with HD textures), plus an additional $0.20 for
    //    detailed geometry and $0.05 for quad mesh if selected."
    //
    // Same tiers as text-to-3d (NOT the +10¢ image-to-3d tiers).
    // `pbr` implies texturing and ALSO defaults to true, so the cheap
    // untextured tier only applies when both `texture` and `pbr` are
    // explicitly disabled. Anything else may texture server-side; bill the
    // textured tier so we never undercharge.
    let texture_enabled = self.texture.unwrap_or(true) || self.pbr.unwrap_or(true);
    let mut cost: u64 = if !texture_enabled {
      10
    } else {
      match self.texture_quality {
        Some(Tripo3dH3p1ImageTextureQuality::Detailed) => 30,
        None | Some(Tripo3dH3p1ImageTextureQuality::Standard) => 20,
      }
    };
    if matches!(self.geometry_quality, Some(Tripo3dH3p1ImageGeometryQuality::Detailed)) {
      cost += 20;
    }
    if self.quad.unwrap_or(false) {
      cost += 5;
    }
    cost
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn base_request() -> Tripo3dH3p1MultiviewToMeshRequest {
    Tripo3dH3p1MultiviewToMeshRequest {
      image_urls: vec![
        "https://example.com/front.jpg".to_string(),
        "https://example.com/left.jpg".to_string(),
      ],
      face_limit: None,
      texture: None,
      pbr: None,
      model_seed: None,
      texture_seed: None,
      texture_quality: None,
      geometry_quality: None,
      texture_alignment: None,
      auto_size: None,
      orientation: None,
      quad: None,
    }
  }

  #[test]
  fn default_is_standard_textures() {
    assert_eq!(base_request().calculate_cost_in_cents(), 20);
  }

  #[test]
  fn no_texture_requires_pbr_off_too() {
    let mut req = base_request();
    req.texture = Some(false);
    req.pbr = Some(false);
    assert_eq!(req.calculate_cost_in_cents(), 10);
  }

  #[test]
  fn texture_off_but_pbr_default_bills_textured_tier() {
    // `pbr` defaults to true and implies texturing.
    let mut req = base_request();
    req.texture = Some(false);
    assert_eq!(req.calculate_cost_in_cents(), 20);
  }

  #[test]
  fn detailed_texture() {
    let mut req = base_request();
    req.texture_quality = Some(Tripo3dH3p1ImageTextureQuality::Detailed);
    assert_eq!(req.calculate_cost_in_cents(), 30);
  }

  #[test]
  fn image_count_does_not_change_cost() {
    let mut req = base_request();
    req.image_urls.push("https://example.com/back.jpg".to_string());
    req.image_urls.push("https://example.com/right.jpg".to_string());
    assert_eq!(req.calculate_cost_in_cents(), 20);
  }

  #[test]
  fn everything_stacks() {
    let mut req = base_request();
    req.texture_quality = Some(Tripo3dH3p1ImageTextureQuality::Detailed);
    req.geometry_quality = Some(Tripo3dH3p1ImageGeometryQuality::Detailed);
    req.quad = Some(true);
    // 30 + 20 + 5 = 55
    assert_eq!(req.calculate_cost_in_cents(), 55);
  }
}
