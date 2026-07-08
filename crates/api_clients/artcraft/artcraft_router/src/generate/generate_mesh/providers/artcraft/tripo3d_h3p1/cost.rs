use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use enums::common::generation::common_mesh_quality::CommonMeshQuality;
use enums::common::generation::common_polygon_type::CommonPolygonType;

use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::providers::artcraft::tripo3d_h3p1::request::ArtcraftTripo3dH3p1RequestState;

// Text and multi-view generations share a price tier; single-image
// generations price higher.
const TEXT_OR_MULTIVIEW_UNTEXTURED_COST_IN_USD_CENTS: u64 = 13;
const TEXT_OR_MULTIVIEW_STANDARD_TEXTURE_COST_IN_USD_CENTS: u64 = 26;
const TEXT_OR_MULTIVIEW_DETAILED_TEXTURE_COST_IN_USD_CENTS: u64 = 39;
const IMAGE_UNTEXTURED_COST_IN_USD_CENTS: u64 = 26;
const IMAGE_STANDARD_TEXTURE_COST_IN_USD_CENTS: u64 = 39;
const IMAGE_DETAILED_TEXTURE_COST_IN_USD_CENTS: u64 = 52;
const DETAILED_GEOMETRY_ADD_ON_COST_IN_USD_CENTS: u64 = 26;
const QUAD_ADD_ON_COST_IN_USD_CENTS: u64 = 7;

/// Tripo3D H3.1 via Artcraft: base price by input mode (text and multi-view
/// share a tier; single-image is higher) and texture tier (untextured,
/// standard, or detailed), plus flat add-ons for detailed geometry and quad
/// topology.
#[derive(Clone, Debug)]
pub struct ArtcraftTripo3dH3p1CostState {
  pub cost_in_usd_cents: u64,
}

impl ArtcraftTripo3dH3p1CostState {
  pub fn from_request(request: &ArtcraftTripo3dH3p1RequestState) -> Self {
    let request = &request.request;

    let uses_multi_view = request.back_image_media_token.is_some()
      || request.left_image_media_token.is_some()
      || request.right_image_media_token.is_some();
    let has_primary_image = request.front_image_media_token.is_some()
      || request.reference_image_media_tokens.as_ref().is_some_and(|tokens| !tokens.is_empty());
    let uses_single_image = !uses_multi_view && has_primary_image;

    // The untextured tier requires that PBR isn't explicitly requested,
    // since PBR implies texturing.
    let texture_off = (matches!(request.mesh_output_type, Some(CommonMeshOutputType::Geometry))
      || request.enable_texture == Some(false))
      && request.enable_pbr != Some(true);

    let (untextured, standard, detailed) = if uses_single_image {
      (
        IMAGE_UNTEXTURED_COST_IN_USD_CENTS,
        IMAGE_STANDARD_TEXTURE_COST_IN_USD_CENTS,
        IMAGE_DETAILED_TEXTURE_COST_IN_USD_CENTS,
      )
    } else {
      (
        TEXT_OR_MULTIVIEW_UNTEXTURED_COST_IN_USD_CENTS,
        TEXT_OR_MULTIVIEW_STANDARD_TEXTURE_COST_IN_USD_CENTS,
        TEXT_OR_MULTIVIEW_DETAILED_TEXTURE_COST_IN_USD_CENTS,
      )
    };

    let mut cost = if texture_off {
      untextured
    } else if matches!(request.texture_quality, Some(CommonMeshQuality::Detailed)) {
      detailed
    } else {
      standard
    };

    if matches!(request.geometry_quality, Some(CommonMeshQuality::Detailed)) {
      cost += DETAILED_GEOMETRY_ADD_ON_COST_IN_USD_CENTS;
    }
    if matches!(request.polygon_type, Some(CommonPolygonType::Quad)) {
      cost += QUAD_ADD_ON_COST_IN_USD_CENTS;
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
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;

  use super::*;

  mod text_mode_costs {
    use super::*;

    #[test]
    fn default_is_standard_textures() {
      assert_eq!(estimate_usd_cents(text_builder()), 26);
    }

    #[test]
    fn untextured_via_enable_texture_off() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        ..text_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 13);
    }

    #[test]
    fn untextured_via_geometry_output() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..text_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 13);
    }

    #[test]
    fn texture_off_with_pbr_keeps_textured_tier() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        enable_pbr: Some(true),
        ..text_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 26);
    }

    #[test]
    fn detailed_texture() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        ..text_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 39);
    }
  }

  mod image_mode_costs {
    use super::*;

    #[test]
    fn default_is_standard_textures() {
      assert_eq!(estimate_usd_cents(image_builder()), 39);
    }

    #[test]
    fn untextured_via_enable_texture_off() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 26);
    }

    #[test]
    fn untextured_via_geometry_output() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 26);
    }

    #[test]
    fn detailed_texture() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 52);
    }

    #[test]
    fn front_image_token_prices_as_image_mode() {
      let builder = GenerateMeshRequestBuilder {
        front_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_front".to_string()))),
        ..base_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 39);
    }
  }

  mod multiview_mode_costs {
    use super::*;

    #[test]
    fn default_is_standard_textures() {
      assert_eq!(estimate_usd_cents(multiview_builder()), 26);
    }

    #[test]
    fn each_side_view_prices_as_multiview() {
      for side in ["back", "left", "right"] {
        let mut builder = image_builder();
        let image = Some(ImageRef::MediaFileToken(MediaFileToken::new(format!("mf_{side}"))));
        match side {
          "back" => builder.back_image = image,
          "left" => builder.left_image = image,
          _ => builder.right_image = image,
        }
        assert_eq!(estimate_usd_cents(builder), 26, "for {side} image");
      }
    }

    #[test]
    fn untextured_via_enable_texture_off() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        ..multiview_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 13);
    }

    #[test]
    fn detailed_texture() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        ..multiview_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 39);
    }
  }

  mod add_ons {
    use super::*;

    #[test]
    fn detailed_geometry_adds_twenty_six_cents() {
      let builder = GenerateMeshRequestBuilder {
        geometry_quality: Some(CommonMeshQuality::Detailed),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 39 + 26);
    }

    #[test]
    fn quad_adds_seven_cents() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Quad),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 39 + 7);
    }

    #[test]
    fn triangle_polygon_adds_nothing() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Triangle),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 39);
    }

    #[test]
    fn standard_qualities_add_nothing() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Standard),
        geometry_quality: Some(CommonMeshQuality::Standard),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 39);
    }

    #[test]
    fn all_add_ons_stack() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Detailed),
        polygon_type: Some(CommonPolygonType::Quad),
        ..image_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 52 + 26 + 7);
    }

    #[test]
    fn add_ons_stack_on_the_untextured_tier() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        geometry_quality: Some(CommonMeshQuality::Detailed),
        polygon_type: Some(CommonPolygonType::Quad),
        ..text_builder()
      };
      assert_eq!(estimate_usd_cents(builder), 13 + 26 + 7);
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Tripo3dH3p1,
      provider: RouterProvider::Artcraft,
      ..Default::default()
    }
  }

  fn text_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      prompt: Some("a red ceramic teapot".to_string()),
      ..base_builder()
    }
  }

  fn image_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_front".to_string()),
      ])),
      ..base_builder()
    }
  }

  fn multiview_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      back_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_back".to_string()))),
      ..image_builder()
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
