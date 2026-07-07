use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::cost::fal_mesh_cost_estimate;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_2p1::request::FalHunyuan3d2p1RequestState;

#[derive(Clone, Debug)]
pub struct FalHunyuan3d2p1CostState {
  pub cost_in_usd_cents: u64,
}

impl FalHunyuan3d2p1CostState {
  pub fn from_request(request: &FalHunyuan3d2p1RequestState) -> Self {
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

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  #[test]
  fn textured_mesh_is_ninety_cents() {
    assert_eq!(estimate_usd_cents(base_builder()), 90);

    let normal = GenerateMeshRequestBuilder {
      mesh_output_type: Some(CommonMeshOutputType::Normal),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(normal), 90);
  }

  #[test]
  fn white_mesh_is_thirty_cents() {
    let builder = GenerateMeshRequestBuilder {
      mesh_output_type: Some(CommonMeshOutputType::Geometry),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 30);
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d2p1,
      provider: RouterProvider::Fal,
      reference_images: Some(ImageListRef::Urls(vec!["https://example.com/front.png".to_string()])),
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
