use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::cost::fal_mesh_cost_estimate;
use crate::generate::generate_mesh::providers::fal::tripo3d_h3p1::request::{
  FalTripo3dH3p1ImageRequestState, FalTripo3dH3p1MultiviewRequestState,
  FalTripo3dH3p1TextRequestState,
};

#[derive(Clone, Debug)]
pub struct FalTripo3dH3p1TextCostState {
  pub cost_in_usd_cents: u64,
}

impl FalTripo3dH3p1TextCostState {
  pub fn from_request(request: &FalTripo3dH3p1TextRequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    Self {
      cost_in_usd_cents: request.request.calculate_cost_in_cents(),
    }
  }

  pub fn estimate_cost(&self) -> MeshGenerationCostEstimate {
    fal_mesh_cost_estimate(self.cost_in_usd_cents)
  }
}

#[derive(Clone, Debug)]
pub struct FalTripo3dH3p1ImageCostState {
  pub cost_in_usd_cents: u64,
}

impl FalTripo3dH3p1ImageCostState {
  pub fn from_request(request: &FalTripo3dH3p1ImageRequestState) -> Self {
    Self {
      cost_in_usd_cents: request.request.calculate_cost_in_cents(),
    }
  }

  pub fn estimate_cost(&self) -> MeshGenerationCostEstimate {
    fal_mesh_cost_estimate(self.cost_in_usd_cents)
  }
}

#[derive(Clone, Debug)]
pub struct FalTripo3dH3p1MultiviewCostState {
  pub cost_in_usd_cents: u64,
}

impl FalTripo3dH3p1MultiviewCostState {
  pub fn from_request(request: &FalTripo3dH3p1MultiviewRequestState) -> Self {
    Self {
      cost_in_usd_cents: request.request.calculate_cost_in_cents(),
    }
  }

  pub fn estimate_cost(&self) -> MeshGenerationCostEstimate {
    fal_mesh_cost_estimate(self.cost_in_usd_cents)
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
  use enums::common::generation::common_mesh_quality::CommonMeshQuality;
  use enums::common::generation::common_polygon_type::CommonPolygonType;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  const FRONT_URL: &str = "https://example.com/front.png";
  const BACK_URL: &str = "https://example.com/back.png";

  mod text_mode_costs {
    use super::*;

    #[test]
    fn default_is_standard_textures() {
      assert_eq!(estimate_usd_cents(text_builder()), 20);
    }

    #[test]
    fn untextured_via_enable_texture_off() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        ..text_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 10);
    }

    #[test]
    fn untextured_via_geometry_output() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..text_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 10);
    }

    #[test]
    fn texture_off_with_pbr_keeps_textured_tier() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        enable_pbr: Some(true),
        ..text_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 20);
    }

    #[test]
    fn detailed_texture() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        ..text_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 30);
    }

    #[test]
    fn add_ons_stack() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Detailed),
        polygon_type: Some(CommonPolygonType::Quad),
        ..text_builder()
      };
      // Detailed texture(30) + detailed geometry(20) + quad(5)
      assert_eq!(estimate_usd_cents(builder), 55);
    }
  }

  mod image_mode_costs {
    use super::*;

    #[test]
    fn default_is_standard_textures() {
      assert_eq!(estimate_usd_cents(image_builder()), 30);
    }

    #[test]
    fn untextured_via_enable_texture_off() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 20);
    }

    #[test]
    fn detailed_texture() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 40);
    }

    #[test]
    fn add_ons_stack() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Detailed),
        polygon_type: Some(CommonPolygonType::Quad),
        ..image_builder()
      };
      // Detailed texture(40) + detailed geometry(20) + quad(5)
      assert_eq!(estimate_usd_cents(builder), 65);
    }
  }

  mod multiview_mode_costs {
    use super::*;

    #[test]
    fn default_is_standard_textures() {
      assert_eq!(estimate_usd_cents(multiview_builder()), 20);
    }

    #[test]
    fn untextured_via_geometry_output() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..multiview_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 10);
    }

    #[test]
    fn detailed_texture() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        ..multiview_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 30);
    }

    #[test]
    fn triangle_polygon_adds_nothing() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Triangle),
        ..multiview_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 20);
    }

    #[test]
    fn add_ons_stack() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Detailed),
        polygon_type: Some(CommonPolygonType::Quad),
        ..multiview_builder()
      };
      // Detailed texture(30) + detailed geometry(20) + quad(5)
      assert_eq!(estimate_usd_cents(builder), 55);
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Tripo3dH3p1,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  fn text_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      prompt: Some("a red ceramic teapot".to_string()),
      ..base_builder()
    }
  }

  fn image_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      reference_images: Some(ImageListRef::Urls(vec![FRONT_URL.to_string()])),
      ..base_builder()
    }
  }

  fn multiview_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      back_image: Some(ImageRef::Url(BACK_URL.to_string())),
      ..image_builder()
    }
  }

  fn estimate_usd_cents(builder: GenerateMeshRequestBuilder) -> u64 {
    builder.build2()
      .expect("build should succeed")
      .estimate_cost()
      .expect("estimate should succeed")
      .cost_in_usd_cents
      .expect("cost should be present")
  }
}
