use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_pro::request::ArtcraftHunyuan3d3p1ProRequestState;

const BASE_COST_IN_USD_CENTS: u64 = 49;
const ADD_ON_COST_IN_USD_CENTS: u64 = 20;

/// Hunyuan 3D v3.1 Pro via Artcraft: flat 49¢ base price (any output type),
/// plus a flat 20¢ add-on for each extra option (PBR materials, custom face
/// count, and multi-view side images).
#[derive(Clone, Debug)]
pub struct ArtcraftHunyuan3d3p1ProCostState {
  pub cost_in_usd_cents: u64,
}

impl ArtcraftHunyuan3d3p1ProCostState {
  pub fn from_request(request: &ArtcraftHunyuan3d3p1ProRequestState) -> Self {
    let request = &request.request;

    let mut cost = BASE_COST_IN_USD_CENTS;
    if request.enable_pbr.unwrap_or(false) {
      cost += ADD_ON_COST_IN_USD_CENTS;
    }
    if request.face_count.is_some() {
      cost += ADD_ON_COST_IN_USD_CENTS;
    }
    let uses_multi_view = request.back_image_media_token.is_some()
      || request.left_image_media_token.is_some()
      || request.right_image_media_token.is_some();
    if uses_multi_view {
      cost += ADD_ON_COST_IN_USD_CENTS;
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
  use crate::api::image_ref::ImageRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  use super::*;

  mod base_costs {
    use super::*;

    #[test]
    fn default_output_type_is_forty_nine_cents() {
      assert_eq!(estimate_usd_cents(base_builder()), 49);
    }

    #[test]
    fn every_output_type_prices_the_same() {
      let cases = [
        Some(CommonMeshOutputType::Normal),
        Some(CommonMeshOutputType::Geometry),
      ];
      for output_type in cases {
        let builder = GenerateMeshRequestBuilder {
          mesh_output_type: output_type,
          ..base_builder()
        };
        assert_eq!(estimate_usd_cents(builder), 49, "for {output_type:?}");
      }
    }

    #[test]
    fn text_mode_prices_the_same_as_image_mode() {
      // Text-only request (no image references).
      let text_builder = GenerateMeshRequestBuilder {
        model: RouterMeshModel::Hunyuan3d3p1Pro,
        provider: RouterProvider::Artcraft,
        prompt: Some("a red ceramic teapot".to_string()),
        ..Default::default()
      };
      assert_eq!(estimate_usd_cents(text_builder), 49);
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
      assert_eq!(estimate_usd_cents(builder), 49 + 20);
    }

    #[test]
    fn pbr_false_adds_nothing() {
      let builder = GenerateMeshRequestBuilder {
        enable_pbr: Some(false),
        ..base_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 49);
    }

    #[test]
    fn face_count_adds_twenty_cents() {
      let builder = GenerateMeshRequestBuilder {
        face_count: Some(100_000),
        ..base_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 49 + 20);
    }

    #[test]
    fn each_side_image_adds_twenty_cents_at_most_once() {
      for side in ["back", "left", "right"] {
        let mut builder = base_builder();
        let image = Some(ImageRef::MediaFileToken(MediaFileToken::new(format!("mf_{side}"))));
        match side {
          "back" => builder.back_image = image,
          "left" => builder.left_image = image,
          _ => builder.right_image = image,
        }
        assert_eq!(estimate_usd_cents(builder), 49 + 20, "for {side} image");
      }

      let builder = GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_back".to_string()))),
        left_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_left".to_string()))),
        right_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_right".to_string()))),
        ..base_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 49 + 20);
    }

    #[test]
    fn all_add_ons_stack() {
      let builder = GenerateMeshRequestBuilder {
        enable_pbr: Some(true),
        face_count: Some(100_000),
        back_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_back".to_string()))),
        ..base_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 49 + 20 + 20 + 20);
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1Pro,
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
