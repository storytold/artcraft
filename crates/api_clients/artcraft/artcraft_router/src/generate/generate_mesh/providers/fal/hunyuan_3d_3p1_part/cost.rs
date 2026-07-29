use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::cost::fal_mesh_cost_estimate;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_part::request::FalHunyuan3d3p1PartRequestState;

#[derive(Clone, Debug)]
pub struct FalHunyuan3d3p1PartCostState {
  pub cost_in_usd_cents: u64,
}

impl FalHunyuan3d3p1PartCostState {
  pub fn from_request(request: &FalHunyuan3d3p1PartRequestState) -> Self {
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
  use crate::api::mesh_ref::MeshRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  const MESH_URL: &str = "https://example.com/model.fbx";

  #[test]
  fn cost_is_a_flat_forty_five_cents() {
    assert_eq!(estimate_usd_cents(mesh_builder()), 45);
  }

  // ── Helpers ──

  fn mesh_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1Part,
      provider: RouterProvider::Fal,
      input_mesh: Some(MeshRef::Url(MESH_URL.to_string())),
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
