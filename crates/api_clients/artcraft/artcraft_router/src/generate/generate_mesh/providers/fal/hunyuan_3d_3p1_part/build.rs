use fal_client::requests::api::mesh::part::hunyuan_3d_3p1_part::api::Hunyuan3d3p1PartRequest;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_part::request::FalHunyuan3d3p1PartRequestState;
use crate::generate::generate_mesh::providers::fal::resolve::plan_input_mesh_url;
use crate::generate::generate_mesh::providers::reject_unsupported::{
  reject_unsupported_image_ref, reject_unsupported_option,
};

/// Hunyuan 3D v3.1 Part splits an existing mesh into semantic parts. It takes
/// only a mesh file (FBX) as input — text, images, and generation options are
/// all unsupported.
pub fn build_fal_hunyuan_3d_3p1_part(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_hunyuan_3d_3p1_part_state(builder)?;
  Ok(MeshGenerationDraftOrRequest::Request(MeshGenerationRequest::FalHunyuan3d3p1Part(state)))
}

pub(crate) fn build_fal_hunyuan_3d_3p1_part_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalHunyuan3d3p1PartRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let input_file_url = plan_input_mesh_url(builder.input_mesh.take())?.ok_or_else(|| {
    ArtcraftRouterError::InvalidInput(
      "Hunyuan 3D v3.1 Part requires an input mesh file (FBX)".to_string(),
    )
  })?;

  // Part splitting takes only the mesh file; every other option is
  // unsupported.
  reject_unsupported_option("prompt", builder.prompt.as_ref(), strategy)?;
  reject_unsupported_option("reference_images", builder.reference_images.as_ref(), strategy)?;
  reject_unsupported_image_ref("front_image", builder.front_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("back_image", builder.back_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("left_image", builder.left_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("right_image", builder.right_image.as_ref(), strategy)?;
  reject_unsupported_option("mesh_output_type", builder.mesh_output_type.as_ref(), strategy)?;
  reject_unsupported_option("polygon_type", builder.polygon_type.as_ref(), strategy)?;
  reject_unsupported_option("face_count", builder.face_count.as_ref(), strategy)?;
  reject_unsupported_option("enable_pbr", builder.enable_pbr.as_ref(), strategy)?;
  reject_unsupported_option("enable_texture", builder.enable_texture.as_ref(), strategy)?;
  reject_unsupported_option("texture_quality", builder.texture_quality.as_ref(), strategy)?;
  reject_unsupported_option("geometry_quality", builder.geometry_quality.as_ref(), strategy)?;

  let request = Hunyuan3d3p1PartRequest { input_file_url };
  Ok(FalHunyuan3d3p1PartRequestState { request })
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
  use enums::common::generation::common_polygon_type::CommonPolygonType;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_ref::ImageRef;
  use crate::api::mesh_ref::MeshRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::errors::client_error::ClientError;

  use super::*;

  const MESH_URL: &str = "https://example.com/model.fbx";

  mod shape_dispatch {
    use super::*;

    #[test]
    fn input_mesh_url_builds_the_request() {
      let state = build_fal_hunyuan_3d_3p1_part_state(mesh_builder()).expect("build");
      assert_eq!(state.request.input_file_url, MESH_URL);
    }

    #[test]
    fn missing_input_mesh_is_rejected() {
      let result = build_fal_hunyuan_3d_3p1_part_state(base_builder());
      assert!(matches!(result, Err(ArtcraftRouterError::InvalidInput(_))));
    }

    #[test]
    fn media_token_input_mesh_is_rejected() {
      let builder = GenerateMeshRequestBuilder {
        input_mesh: Some(MeshRef::MediaFileToken(MediaFileToken::new("mf_mesh".to_string()))),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_hunyuan_3d_3p1_part_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn each_unsupported_option_errors_out_under_error_out() {
      let cases: Vec<fn(&mut GenerateMeshRequestBuilder)> = vec![
        |b| b.prompt = Some("a red ceramic teapot".to_string()),
        |b| b.front_image = Some(ImageRef::Url("https://example.com/front.png".to_string())),
        |b| b.back_image = Some(ImageRef::Url("https://example.com/back.png".to_string())),
        |b| b.mesh_output_type = Some(CommonMeshOutputType::Normal),
        |b| b.polygon_type = Some(CommonPolygonType::Quad),
        |b| b.face_count = Some(100_000),
        |b| b.enable_pbr = Some(true),
        |b| b.enable_texture = Some(false),
      ];
      for (index, set) in cases.into_iter().enumerate() {
        let mut builder = GenerateMeshRequestBuilder {
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
          ..mesh_builder()
        };
        set(&mut builder);
        assert!(build_fal_hunyuan_3d_3p1_part_state(builder).is_err(), "for case {index}");
      }
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        mesh_output_type: Some(CommonMeshOutputType::Normal),
        face_count: Some(100_000),
        enable_pbr: Some(true),
        ..mesh_builder()
      };
      let state = build_fal_hunyuan_3d_3p1_part_state(builder).expect("build");
      assert_eq!(state.request.input_file_url, MESH_URL);
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1Part,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  fn mesh_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      input_mesh: Some(MeshRef::Url(MESH_URL.to_string())),
      ..base_builder()
    }
  }
}
