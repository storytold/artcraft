use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::cost::fal_mesh_cost_estimate;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3_sketch::request::FalHunyuan3d3SketchRequestState;

#[derive(Clone, Debug)]
pub struct FalHunyuan3d3SketchCostState {
  pub cost_in_usd_cents: u64,
}

impl FalHunyuan3d3SketchCostState {
  pub fn from_request(request: &FalHunyuan3d3SketchRequestState) -> Self {
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
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  #[test]
  fn base_cost_is_thirty_eight_cents() {
    assert_eq!(estimate_usd_cents(base_builder()), 38);
  }

  #[test]
  fn pbr_adds_fifteen_cents() {
    let builder = GenerateMeshRequestBuilder {
      enable_pbr: Some(true),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 38 + 15);
  }

  #[test]
  fn face_count_adds_fifteen_cents() {
    let builder = GenerateMeshRequestBuilder {
      face_count: Some(100_000),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 38 + 15);
  }

  #[test]
  fn all_add_ons_stack() {
    let builder = GenerateMeshRequestBuilder {
      enable_pbr: Some(true),
      face_count: Some(100_000),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 38 + 15 + 15);
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3Sketch,
      provider: RouterProvider::Fal,
      prompt: Some("a red ceramic teapot".to_string()),
      reference_images: Some(ImageListRef::Urls(vec!["https://example.com/sketch.png".to_string()])),
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
