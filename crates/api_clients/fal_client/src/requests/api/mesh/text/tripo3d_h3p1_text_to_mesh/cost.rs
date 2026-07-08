use crate::requests::api::mesh::text::tripo3d_h3p1_text_to_mesh::api::{
  Tripo3dH3p1GeometryQuality, Tripo3dH3p1TextToMeshRequest, Tripo3dH3p1TextureQuality,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

impl FalRequestCostCalculator for Tripo3dH3p1TextToMeshRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing (see https://fal.ai/models/tripo3d/h3.1/text-to-3d):
    //   "Your request will cost $0.10 (without textures), $0.20 (with standard
    //    textures), or $0.30 (with HD textures), plus an additional $0.20 for
    //    detailed geometry and $0.05 for quad mesh if selected."
    //
    // `texture` defaults to true, so the standard-texture tier is the default.
    // "HD textures" = texture_quality "detailed".
    // `pbr` implies texturing and ALSO defaults to true, so the cheap
    // untextured tier only applies when both `texture` and `pbr` are
    // explicitly disabled. Anything else may texture server-side; bill the
    // textured tier so we never undercharge.
    let texture_enabled = self.texture.unwrap_or(true) || self.pbr.unwrap_or(true);
    let mut cost: u64 = if !texture_enabled {
      10
    } else {
      match self.texture_quality {
        Some(Tripo3dH3p1TextureQuality::Detailed) => 30,
        None | Some(Tripo3dH3p1TextureQuality::Standard) => 20,
      }
    };
    if matches!(self.geometry_quality, Some(Tripo3dH3p1GeometryQuality::Detailed)) {
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

  fn base_request() -> Tripo3dH3p1TextToMeshRequest {
    Tripo3dH3p1TextToMeshRequest {
      prompt: "p".to_string(),
      negative_prompt: None,
      face_limit: None,
      texture: None,
      pbr: None,
      model_seed: None,
      image_seed: None,
      texture_seed: None,
      texture_quality: None,
      geometry_quality: None,
      auto_size: None,
      quad: None,
    }
  }

  mod texture_tiers {
    use super::*;

    #[test]
    fn default_is_standard_textures() {
      // texture defaults to true → $0.20
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
      req.texture_quality = Some(Tripo3dH3p1TextureQuality::Detailed);
      assert_eq!(req.calculate_cost_in_cents(), 30);
    }
  }

  mod add_ons {
    use super::*;

    #[test]
    fn detailed_geometry_adds_twenty() {
      let mut req = base_request();
      req.geometry_quality = Some(Tripo3dH3p1GeometryQuality::Detailed);
      assert_eq!(req.calculate_cost_in_cents(), 20 + 20);
    }

    #[test]
    fn quad_adds_five() {
      let mut req = base_request();
      req.quad = Some(true);
      assert_eq!(req.calculate_cost_in_cents(), 20 + 5);
    }

    #[test]
    fn everything_stacks() {
      let mut req = base_request();
      req.texture_quality = Some(Tripo3dH3p1TextureQuality::Detailed);
      req.geometry_quality = Some(Tripo3dH3p1GeometryQuality::Detailed);
      req.quad = Some(true);
      // 30 + 20 + 5 = 55
      assert_eq!(req.calculate_cost_in_cents(), 55);
    }

    #[test]
    fn no_texture_with_add_ons() {
      let mut req = base_request();
      req.texture = Some(false);
      req.pbr = Some(false);
      req.geometry_quality = Some(Tripo3dH3p1GeometryQuality::Detailed);
      req.quad = Some(true);
      // 10 + 20 + 5 = 35
      assert_eq!(req.calculate_cost_in_cents(), 35);
    }

    #[test]
    fn pbr_does_not_change_cost() {
      let mut req = base_request();
      req.pbr = Some(false);
      assert_eq!(req.calculate_cost_in_cents(), 20);
    }
  }
}
