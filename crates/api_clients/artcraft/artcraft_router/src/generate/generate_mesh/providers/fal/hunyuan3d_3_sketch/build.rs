use fal_client::requests::api::mesh::sketch::hunyuan3d_3_sketch_to_mesh::api::Hunyuan3d3SketchToMeshRequest;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3_sketch::request::FalHunyuan3d3SketchRequestState;
use crate::generate::generate_mesh::providers::fal::resolve::{
  plan_face_count, plan_primary_image_url,
};
use crate::generate::generate_mesh::providers::reject_unsupported::{
  reject_unsupported_image_ref, reject_unsupported_option,
};

pub fn build_fal_hunyuan3d_3_sketch(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_hunyuan3d_3_sketch_state(builder)?;
  Ok(MeshGenerationDraftOrRequest::Request(MeshGenerationRequest::FalHunyuan3d3Sketch(state)))
}

pub(crate) fn build_fal_hunyuan3d_3_sketch_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalHunyuan3d3SketchRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // fal's sketch-to-3d schema has no generate_type/polygon_type parameters,
  // and no multi-view side images.
  reject_unsupported_option("mesh_output_type", builder.mesh_output_type.as_ref(), strategy)?;
  reject_unsupported_option("polygon_type", builder.polygon_type.as_ref(), strategy)?;
  reject_unsupported_image_ref("back_image", builder.back_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("left_image", builder.left_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("right_image", builder.right_image.as_ref(), strategy)?;

  let image_url = plan_primary_image_url(
    builder.reference_images.take(),
    builder.front_image.take(),
    strategy,
  )?
    .ok_or_else(|| ArtcraftRouterError::InvalidInput(
      "A sketch image is required for Hunyuan 3D v3 sketch-to-3D".to_string(),
    ))?;

  let prompt = builder.prompt.take().ok_or_else(|| {
    ArtcraftRouterError::InvalidInput(
      "A prompt is required for Hunyuan 3D v3 sketch-to-3D".to_string(),
    )
  })?;

  let request = Hunyuan3d3SketchToMeshRequest {
    image_url,
    prompt,
    face_count: plan_face_count(builder.face_count, strategy)?,
    enable_pbr: builder.enable_pbr,
  };

  Ok(FalHunyuan3d3SketchRequestState { request })
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
  use enums::common::generation::common_polygon_type::CommonPolygonType;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;

  use super::*;

  const SKETCH_URL: &str = "https://example.com/sketch.png";

  #[test]
  fn sketch_and_prompt_pass_through() {
    let state = build_fal_hunyuan3d_3_sketch_state(base_builder()).expect("build");
    assert_eq!(state.request.image_url, SKETCH_URL);
    assert_eq!(state.request.prompt, "a red ceramic teapot");
  }

  #[test]
  fn missing_sketch_is_rejected() {
    let builder = GenerateMeshRequestBuilder { reference_images: None, ..base_builder() };
    assert!(matches!(
      build_fal_hunyuan3d_3_sketch_state(builder),
      Err(ArtcraftRouterError::InvalidInput(_))
    ));
  }

  #[test]
  fn missing_prompt_is_rejected() {
    let builder = GenerateMeshRequestBuilder { prompt: None, ..base_builder() };
    assert!(matches!(
      build_fal_hunyuan3d_3_sketch_state(builder),
      Err(ArtcraftRouterError::InvalidInput(_))
    ));
  }

  #[test]
  fn face_count_and_pbr_pass_through() {
    let builder = GenerateMeshRequestBuilder {
      face_count: Some(100_000),
      enable_pbr: Some(true),
      ..base_builder()
    };
    let state = build_fal_hunyuan3d_3_sketch_state(builder).expect("build");
    assert_eq!(state.request.face_count, Some(100_000));
    assert_eq!(state.request.enable_pbr, Some(true));
  }

  #[test]
  fn unsupported_options_error_out() {
    let cases: Vec<GenerateMeshRequestBuilder> = vec![
      GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        ..base_builder()
      },
      GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Quad),
        ..base_builder()
      },
      GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::Url("https://example.com/back.png".to_string())),
        ..base_builder()
      },
    ];
    for mut builder in cases {
      builder.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_hunyuan3d_3_sketch_state(builder).is_err());
    }
  }

  #[test]
  fn unsupported_options_are_dropped_under_lenient_strategies() {
    let builder = GenerateMeshRequestBuilder {
      mesh_output_type: Some(CommonMeshOutputType::LowPoly),
      polygon_type: Some(CommonPolygonType::Quad),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      ..base_builder()
    };
    assert!(build_fal_hunyuan3d_3_sketch_state(builder).is_ok());
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3Sketch,
      provider: RouterProvider::Fal,
      prompt: Some("a red ceramic teapot".to_string()),
      reference_images: Some(ImageListRef::Urls(vec![SKETCH_URL.to_string()])),
      ..Default::default()
    }
  }
}
