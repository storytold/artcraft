use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_rapid::request::ArtcraftHunyuan3d3p1RapidRequestState;

const BASE_COST_IN_USD_CENTS: u64 = 30;
const PBR_ADD_ON_COST_IN_USD_CENTS: u64 = 20;

/// Hunyuan 3D v3.1 Rapid via Artcraft: flat 30¢ base price, plus a flat 20¢
/// add-on for PBR materials.
#[derive(Clone, Debug)]
pub struct ArtcraftHunyuan3d3p1RapidCostState {
  pub cost_in_usd_cents: u64,
}

impl ArtcraftHunyuan3d3p1RapidCostState {
  pub fn from_request(request: &ArtcraftHunyuan3d3p1RapidRequestState) -> Self {
    let request = &request.request;

    let mut cost = BASE_COST_IN_USD_CENTS;
    if request.enable_pbr.unwrap_or(false) {
      cost += PBR_ADD_ON_COST_IN_USD_CENTS;
    }

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
  use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  use super::*;

  mod base_costs {
    use super::*;

    #[test]
    fn base_cost_is_thirty_cents() {
      assert_eq!(estimate_usd_cents(base_builder()), 30);
    }

    #[test]
    fn text_mode_prices_the_same_as_image_mode() {
      // Text-only request (no image references).
      let text_builder = GenerateMeshRequestBuilder {
        model: RouterMeshModel::Hunyuan3d3p1Rapid,
        provider: RouterProvider::Artcraft,
        prompt: Some("a red ceramic teapot".to_string()),
        ..Default::default()
      };
      assert_eq!(estimate_usd_cents(text_builder), 30);
    }

    #[test]
    fn output_type_does_not_change_the_price() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..base_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 30);
    }
  }

  mod add_ons {
    use super::*;

    #[test]
    fn pbr_adds_twenty_cents() {
      let builder = GenerateMeshRequestBuilder {
        enable_pbr: Some(true),
        ..base_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 30 + 20);
    }

    #[test]
    fn pbr_false_adds_nothing() {
      let builder = GenerateMeshRequestBuilder {
        enable_pbr: Some(false),
        ..base_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 30);
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1Rapid,
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
