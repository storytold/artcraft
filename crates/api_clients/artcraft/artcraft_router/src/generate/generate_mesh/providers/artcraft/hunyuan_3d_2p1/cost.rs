use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;

use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_2p1::request::ArtcraftHunyuan3d2p1RequestState;

const TEXTURED_COST_IN_USD_CENTS: u64 = 117;
const GEOMETRY_COST_IN_USD_CENTS: u64 = 39;

/// Hunyuan 3D 2.1 via Artcraft: flat price by output type. Geometry-only
/// (white mesh) is cheaper; every other output type prices as textured.
#[derive(Clone, Debug)]
pub struct ArtcraftHunyuan3d2p1CostState {
  pub cost_in_usd_cents: u64,
}

impl ArtcraftHunyuan3d2p1CostState {
  pub fn from_request(request: &ArtcraftHunyuan3d2p1RequestState) -> Self {
    let cost = match request.request.mesh_output_type {
      Some(CommonMeshOutputType::Geometry) => GEOMETRY_COST_IN_USD_CENTS,
      None | Some(_) => TEXTURED_COST_IN_USD_CENTS,
    };
    Self { cost_in_usd_cents: cost }
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
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  use super::*;

  #[test]
  fn default_output_type_is_one_seventeen_cents() {
    assert_eq!(estimate_usd_cents(base_builder()), 117);
  }

  #[test]
  fn normal_is_one_seventeen_cents() {
    let builder = GenerateMeshRequestBuilder {
      mesh_output_type: Some(CommonMeshOutputType::Normal),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 117);
  }

  #[test]
  fn geometry_is_thirty_nine_cents() {
    let builder = GenerateMeshRequestBuilder {
      mesh_output_type: Some(CommonMeshOutputType::Geometry),
      ..base_builder()
    };
    assert_eq!(estimate_usd_cents(builder), 39);
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d2p1,
      provider: RouterProvider::Artcraft,
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_front".to_string()),
      ])),
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
