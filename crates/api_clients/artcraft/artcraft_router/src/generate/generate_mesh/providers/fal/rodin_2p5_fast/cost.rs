use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::cost::fal_mesh_cost_estimate;
use crate::generate::generate_mesh::providers::fal::rodin_2p5_fast::request::{
  FalRodin2p5FastImageRequestState, FalRodin2p5FastTextRequestState,
};

#[derive(Clone, Debug)]
pub struct FalRodin2p5FastImageCostState {
  pub cost_in_usd_cents: u64,
}

impl FalRodin2p5FastImageCostState {
  pub fn from_request(request: &FalRodin2p5FastImageRequestState) -> Self {
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
pub struct FalRodin2p5FastTextCostState {
  pub cost_in_usd_cents: u64,
}

impl FalRodin2p5FastTextCostState {
  pub fn from_request(request: &FalRodin2p5FastTextRequestState) -> Self {
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

  const FRONT_URL: &str = "https://example.com/front.png";

  mod flat_pricing {
    use super::*;

    #[test]
    fn image_mode_is_ten_cents() {
      assert_eq!(estimate_usd_cents(image_builder()), 10);
    }

    #[test]
    fn text_mode_is_ten_cents() {
      assert_eq!(estimate_usd_cents(text_builder()), 10);
    }

    #[test]
    fn options_do_not_change_the_price() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        enable_pbr: Some(true),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 10);
    }
  }

  // ── Helpers ──

  fn image_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Rodin2p5Fast,
      provider: RouterProvider::Fal,
      reference_images: Some(ImageListRef::Urls(vec![FRONT_URL.to_string()])),
      ..Default::default()
    }
  }

  fn text_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Rodin2p5Fast,
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
