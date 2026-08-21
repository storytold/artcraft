use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_smart_topology::request::ArtcraftHunyuan3d3p1SmartTopologyRequestState;

const FLAT_COST_IN_USD_CENTS: u64 = 98;

/// Hunyuan 3D v3.1 Smart Topology via Artcraft: flat 98¢ per generation,
/// with no add-ons.
#[derive(Clone, Debug)]
pub struct ArtcraftHunyuan3d3p1SmartTopologyCostState {
  pub cost_in_usd_cents: u64,
}

impl ArtcraftHunyuan3d3p1SmartTopologyCostState {
  pub fn from_request(_request: &ArtcraftHunyuan3d3p1SmartTopologyRequestState) -> Self {
    Self { cost_in_usd_cents: FLAT_COST_IN_USD_CENTS }
  }

  pub fn estimate_cost(&self) -> MeshGenerationCostEstimate {
    MeshGenerationCostEstimate {
      cost_in_credits: Some(self.cost_in_usd_cents),
      cost_in_usd_cents: Some(self.cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_polygon_type::CommonPolygonType;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::mesh_ref::MeshRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  mod cost_table {
    use super::*;

    #[test]
    fn cost_is_a_flat_ninety_eight_cents() {
      assert_eq!(estimate_usd_cents(base_builder()), 98);
    }

    #[test]
    fn polygon_type_does_not_change_the_price() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Quad),
        ..base_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 98);
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1SmartTopology,
      provider: RouterProvider::Artcraft,
      input_mesh: Some(MeshRef::MediaFileToken(MediaFileToken::new("mf_mesh".to_string()))),
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
