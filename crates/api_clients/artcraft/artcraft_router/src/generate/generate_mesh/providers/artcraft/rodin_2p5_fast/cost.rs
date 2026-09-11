use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::artcraft::rodin_2p5_fast::request::ArtcraftRodin2p5FastRequestState;

const FLAT_COST_IN_USD_CENTS: u64 = 13;

/// Hyper3D Rodin v2.5 Fast via Artcraft: flat price per generation,
/// regardless of options or input mode (text or image).
#[derive(Clone, Debug)]
pub struct ArtcraftRodin2p5FastCostState {
  pub cost_in_usd_cents: u64,
}

impl ArtcraftRodin2p5FastCostState {
  pub fn from_request(_request: &ArtcraftRodin2p5FastRequestState) -> Self {
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
  use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  use super::*;

  mod flat_pricing {
    use super::*;

    #[test]
    fn image_mode_is_thirteen_cents() {
      assert_eq!(estimate_usd_cents(image_builder()), 13);
    }

    #[test]
    fn text_mode_is_thirteen_cents() {
      assert_eq!(estimate_usd_cents(text_builder()), 13);
    }

    #[test]
    fn options_do_not_change_the_price() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        enable_pbr: Some(true),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 13);
    }
  }

  // ── Helpers ──

  fn image_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Rodin2p5Fast,
      provider: RouterProvider::Artcraft,
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_front".to_string()),
      ])),
      ..Default::default()
    }
  }

  fn text_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Rodin2p5Fast,
      provider: RouterProvider::Artcraft,
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
