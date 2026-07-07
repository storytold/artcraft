use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::request::{
  FalHunyuan3d3ImageRequestState, FalHunyuan3d3TextRequestState,
};

#[derive(Clone, Debug)]
pub struct FalHunyuan3d3ImageCostState {
  pub cost_in_usd_cents: u64,
}

impl FalHunyuan3d3ImageCostState {
  pub fn from_request(request: &FalHunyuan3d3ImageRequestState) -> Self {
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
pub struct FalHunyuan3d3TextCostState {
  pub cost_in_usd_cents: u64,
}

impl FalHunyuan3d3TextCostState {
  pub fn from_request(request: &FalHunyuan3d3TextRequestState) -> Self {
    Self {
      cost_in_usd_cents: request.request.calculate_cost_in_cents(),
    }
  }

  pub fn estimate_cost(&self) -> MeshGenerationCostEstimate {
    fal_mesh_cost_estimate(self.cost_in_usd_cents)
  }
}

pub(crate) fn fal_mesh_cost_estimate(cost_in_usd_cents: u64) -> MeshGenerationCostEstimate {
  MeshGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
    failures_are_refunded: None,
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  const FRONT_URL: &str = "https://example.com/front.png";

  mod image_mode_costs {
    use super::*;

    #[test]
    fn base_cost_table() {
      let cases = [
        (None, 38),
        (Some(CommonMeshOutputType::Normal), 38),
        (Some(CommonMeshOutputType::LowPoly), 45),
        (Some(CommonMeshOutputType::Geometry), 23),
      ];
      for (output_type, expected) in cases {
        let builder = GenerateMeshRequestBuilder {
          mesh_output_type: output_type,
          ..image_builder()
        };
        assert_eq!(estimate_usd_cents(builder), expected, "for {output_type:?}");
      }
    }

    #[test]
    fn add_ons_stack() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        enable_pbr: Some(true),
        face_count: Some(100_000),
        back_image: Some(ImageRef::Url("https://example.com/back.png".to_string())),
        ..image_builder()
      };
      // LowPoly(45) + PBR(15) + face_count(15) + multi_view(15)
      assert_eq!(estimate_usd_cents(builder), 90);
    }
  }

  mod text_mode_costs {
    use super::*;

    #[test]
    fn base_cost_table() {
      let cases = [
        (None, 38),
        (Some(CommonMeshOutputType::Normal), 38),
        (Some(CommonMeshOutputType::LowPoly), 45),
        (Some(CommonMeshOutputType::Geometry), 23),
      ];
      for (output_type, expected) in cases {
        let builder = GenerateMeshRequestBuilder {
          mesh_output_type: output_type,
          ..text_builder()
        };
        assert_eq!(estimate_usd_cents(builder), expected, "for {output_type:?}");
      }
    }

    #[test]
    fn add_ons_stack() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        enable_pbr: Some(true),
        face_count: Some(40_000),
        ..text_builder()
      };
      // Geometry(23) + PBR(15) + face_count(15)
      assert_eq!(estimate_usd_cents(builder), 53);
    }
  }

  // ── Helpers ──

  fn image_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3,
      provider: RouterProvider::Fal,
      reference_images: Some(ImageListRef::Urls(vec![FRONT_URL.to_string()])),
      ..Default::default()
    }
  }

  fn text_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3,
      provider: RouterProvider::Fal,
      prompt: Some("a red ceramic teapot".to_string()),
      ..Default::default()
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
