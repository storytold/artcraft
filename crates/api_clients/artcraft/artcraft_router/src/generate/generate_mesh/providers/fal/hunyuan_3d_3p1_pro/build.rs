use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use fal_client::requests::api::mesh::image::hunyuan_3d_3p1_pro_image_to_mesh::api::{
  Hunyuan3d3p1ProImageToMeshGenerateType, Hunyuan3d3p1ProImageToMeshRequest,
};
use fal_client::requests::api::mesh::text::hunyuan_3d_3p1_pro_text_to_mesh::api::{
  Hunyuan3d3p1ProTextToMeshGenerateType, Hunyuan3d3p1ProTextToMeshRequest,
};

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_pro::request::{
  FalHunyuan3d3p1ProImageRequestState, FalHunyuan3d3p1ProTextRequestState,
};
use crate::generate::generate_mesh::providers::fal::resolve::{
  plan_face_count, plan_primary_image_url, plan_side_image_url,
};
use crate::generate::generate_mesh::providers::reject_unsupported::{
  reject_unsupported_image_ref, reject_unsupported_option,
};

/// Hunyuan 3D v3.1 Pro combines fal's image-to-3d and text-to-3d endpoints
/// under a single router model. The request shape picks the endpoint: any
/// image input (reference images or `front_image`) dispatches to image-to-3d;
/// otherwise a prompt dispatches to text-to-3d.
pub fn build_fal_hunyuan_3d_3p1_pro(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_hunyuan_3d_3p1_pro_state(builder)?;
  let request = match state {
    FalHunyuan3d3p1ProState::Image(state) => MeshGenerationRequest::FalHunyuan3d3p1ProImage(state),
    FalHunyuan3d3p1ProState::Text(state) => MeshGenerationRequest::FalHunyuan3d3p1ProText(state),
  };
  Ok(MeshGenerationDraftOrRequest::Request(request))
}

/// The endpoint selected by the request shape.
#[derive(Clone, Debug)]
pub(crate) enum FalHunyuan3d3p1ProState {
  Image(FalHunyuan3d3p1ProImageRequestState),
  Text(FalHunyuan3d3p1ProTextRequestState),
}

pub(crate) fn build_fal_hunyuan_3d_3p1_pro_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalHunyuan3d3p1ProState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // v3.1 Pro has no polygon-type, texture, or input-mesh parameters.
  reject_unsupported_option("polygon_type", builder.polygon_type.as_ref(), strategy)?;
  reject_unsupported_option("enable_texture", builder.enable_texture.as_ref(), strategy)?;
  reject_unsupported_option("texture_quality", builder.texture_quality.as_ref(), strategy)?;
  reject_unsupported_option("geometry_quality", builder.geometry_quality.as_ref(), strategy)?;
  reject_unsupported_option("input_mesh", builder.input_mesh.as_ref(), strategy)?;

  let maybe_front_url = plan_primary_image_url(
    builder.reference_images.take(),
    builder.front_image.take(),
    strategy,
  )?;
  let face_count = plan_face_count(builder.face_count, strategy)?;

  match maybe_front_url {
    Some(image_url) => {
      // Image mode. The image endpoint has no prompt parameter.
      reject_unsupported_option("prompt", builder.prompt.as_ref(), strategy)?;

      let request = Hunyuan3d3p1ProImageToMeshRequest {
        image_url,
        back_image_url: plan_side_image_url(builder.back_image.take())?,
        left_image_url: plan_side_image_url(builder.left_image.take())?,
        right_image_url: plan_side_image_url(builder.right_image.take())?,
        // The builder has no fields for the v3.1-exclusive extra views.
        top_image_url: None,
        bottom_image_url: None,
        left_front_image_url: None,
        right_front_image_url: None,
        generate_type: plan_image_generate_type(builder.mesh_output_type, strategy)?,
        face_count,
        enable_pbr: builder.enable_pbr,
      };
      Ok(FalHunyuan3d3p1ProState::Image(FalHunyuan3d3p1ProImageRequestState { request }))
    }
    None => {
      // Text mode. Multi-view side images only make sense alongside a front
      // image, so they're unsupported here.
      reject_unsupported_image_ref("back_image", builder.back_image.as_ref(), strategy)?;
      reject_unsupported_image_ref("left_image", builder.left_image.as_ref(), strategy)?;
      reject_unsupported_image_ref("right_image", builder.right_image.as_ref(), strategy)?;

      let prompt = builder.prompt.take().ok_or_else(|| {
        ArtcraftRouterError::InvalidInput(
          "Hunyuan 3D v3.1 Pro requires an input image or a prompt".to_string(),
        )
      })?;

      let request = Hunyuan3d3p1ProTextToMeshRequest {
        prompt,
        generate_type: plan_text_generate_type(builder.mesh_output_type, strategy)?,
        face_count,
        enable_pbr: builder.enable_pbr,
      };
      Ok(FalHunyuan3d3p1ProState::Text(FalHunyuan3d3p1ProTextRequestState { request }))
    }
  }
}

// ── Enum mapping helpers ──

/// v3.1 drops the v3 `LowPoly` generation type: `LowPoly` rejects under
/// `ErrorOut` and drops to the endpoint default otherwise.
fn plan_image_generate_type(
  mesh_output_type: Option<CommonMeshOutputType>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Hunyuan3d3p1ProImageToMeshGenerateType>, ArtcraftRouterError> {
  match mesh_output_type {
    None => Ok(None),
    Some(CommonMeshOutputType::Normal) => Ok(Some(Hunyuan3d3p1ProImageToMeshGenerateType::Normal)),
    Some(CommonMeshOutputType::Geometry) => Ok(Some(Hunyuan3d3p1ProImageToMeshGenerateType::Geometry)),
    Some(CommonMeshOutputType::LowPoly) => {
      reject_unsupported_option("mesh_output_type", Some(&CommonMeshOutputType::LowPoly), strategy)?;
      Ok(None)
    }
  }
}

fn plan_text_generate_type(
  mesh_output_type: Option<CommonMeshOutputType>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Hunyuan3d3p1ProTextToMeshGenerateType>, ArtcraftRouterError> {
  match mesh_output_type {
    None => Ok(None),
    Some(CommonMeshOutputType::Normal) => Ok(Some(Hunyuan3d3p1ProTextToMeshGenerateType::Normal)),
    Some(CommonMeshOutputType::Geometry) => Ok(Some(Hunyuan3d3p1ProTextToMeshGenerateType::Geometry)),
    Some(CommonMeshOutputType::LowPoly) => {
      reject_unsupported_option("mesh_output_type", Some(&CommonMeshOutputType::LowPoly), strategy)?;
      Ok(None)
    }
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_quality::CommonMeshQuality;
  use enums::common::generation::common_polygon_type::CommonPolygonType;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::mesh_ref::MeshRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;

  use super::*;

  const FRONT_URL: &str = "https://example.com/front.png";
  const BACK_URL: &str = "https://example.com/back.png";

  mod shape_dispatch {
    use super::*;

    #[test]
    fn reference_image_dispatches_to_image_mode() {
      let state = build_fal_hunyuan_3d_3p1_pro_state(image_builder()).expect("build");
      let image = expect_image(state);
      assert_eq!(image.request.image_url, FRONT_URL);
    }

    #[test]
    fn front_image_dispatches_to_image_mode() {
      let builder = GenerateMeshRequestBuilder {
        reference_images: None,
        front_image: Some(ImageRef::Url(FRONT_URL.to_string())),
        ..base_builder()
      };
      let state = build_fal_hunyuan_3d_3p1_pro_state(builder).expect("build");
      let image = expect_image(state);
      assert_eq!(image.request.image_url, FRONT_URL);
    }

    #[test]
    fn prompt_only_dispatches_to_text_mode() {
      let state = build_fal_hunyuan_3d_3p1_pro_state(text_builder()).expect("build");
      let text = expect_text(state);
      assert_eq!(text.request.prompt, "a red ceramic teapot");
    }

    #[test]
    fn neither_image_nor_prompt_is_rejected() {
      let result = build_fal_hunyuan_3d_3p1_pro_state(base_builder());
      assert!(matches!(result, Err(ArtcraftRouterError::InvalidInput(_))));
    }
  }

  mod image_mode {
    use super::*;

    #[test]
    fn side_images_map_to_multi_view_params() {
      let builder = GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::Url(BACK_URL.to_string())),
        left_image: Some(ImageRef::Url("https://example.com/left.png".to_string())),
        right_image: Some(ImageRef::Url("https://example.com/right.png".to_string())),
        ..image_builder()
      };
      let image = expect_image(build_fal_hunyuan_3d_3p1_pro_state(builder).expect("build"));
      assert_eq!(image.request.back_image_url.as_deref(), Some(BACK_URL));
      assert_eq!(image.request.left_image_url.as_deref(), Some("https://example.com/left.png"));
      assert_eq!(image.request.right_image_url.as_deref(), Some("https://example.com/right.png"));
    }

    #[test]
    fn v3p1_exclusive_extra_views_are_left_unset() {
      let image = expect_image(build_fal_hunyuan_3d_3p1_pro_state(image_builder()).expect("build"));
      assert!(image.request.top_image_url.is_none());
      assert!(image.request.bottom_image_url.is_none());
      assert!(image.request.left_front_image_url.is_none());
      assert!(image.request.right_front_image_url.is_none());
    }

    #[test]
    fn options_map_through() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        face_count: Some(100_000),
        enable_pbr: Some(true),
        ..image_builder()
      };
      let image = expect_image(build_fal_hunyuan_3d_3p1_pro_state(builder).expect("build"));
      assert!(matches!(image.request.generate_type, Some(Hunyuan3d3p1ProImageToMeshGenerateType::Geometry)));
      assert_eq!(image.request.face_count, Some(100_000));
      assert_eq!(image.request.enable_pbr, Some(true));
    }

    #[test]
    fn low_poly_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_hunyuan_3d_3p1_pro_state(builder).is_err());
    }

    #[test]
    fn low_poly_drops_to_default_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        ..image_builder()
      };
      let image = expect_image(build_fal_hunyuan_3d_3p1_pro_state(builder).expect("build"));
      assert!(image.request.generate_type.is_none());
    }

    #[test]
    fn prompt_with_image_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_hunyuan_3d_3p1_pro_state(builder).is_err());
    }

    #[test]
    fn prompt_with_image_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_hunyuan_3d_3p1_pro_state(builder).expect("build"),
        FalHunyuan3d3p1ProState::Image(_)
      ));
    }
  }

  mod text_mode {
    use super::*;

    #[test]
    fn options_map_through() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Normal),
        face_count: Some(40_000),
        enable_pbr: Some(false),
        ..text_builder()
      };
      let text = expect_text(build_fal_hunyuan_3d_3p1_pro_state(builder).expect("build"));
      assert!(matches!(text.request.generate_type, Some(Hunyuan3d3p1ProTextToMeshGenerateType::Normal)));
      assert_eq!(text.request.face_count, Some(40_000));
      assert_eq!(text.request.enable_pbr, Some(false));
    }

    #[test]
    fn side_images_without_front_error_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::Url(BACK_URL.to_string())),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..text_builder()
      };
      assert!(build_fal_hunyuan_3d_3p1_pro_state(builder).is_err());
    }

    #[test]
    fn side_images_without_front_are_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::Url(BACK_URL.to_string())),
        ..text_builder()
      };
      assert!(matches!(
        build_fal_hunyuan_3d_3p1_pro_state(builder).expect("build"),
        FalHunyuan3d3p1ProState::Text(_)
      ));
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn polygon_type_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Quad),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_hunyuan_3d_3p1_pro_state(builder).is_err());
    }

    #[test]
    fn texture_options_error_out_under_error_out() {
      let cases: Vec<fn(&mut GenerateMeshRequestBuilder)> = vec![
        |b| b.enable_texture = Some(false),
        |b| b.texture_quality = Some(CommonMeshQuality::Detailed),
        |b| b.geometry_quality = Some(CommonMeshQuality::Detailed),
      ];
      for (index, set) in cases.into_iter().enumerate() {
        let mut builder = GenerateMeshRequestBuilder {
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
          ..image_builder()
        };
        set(&mut builder);
        assert!(build_fal_hunyuan_3d_3p1_pro_state(builder).is_err(), "for case {index}");
      }
    }

    #[test]
    fn input_mesh_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        input_mesh: Some(MeshRef::Url("https://example.com/model.glb".to_string())),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..text_builder()
      };
      assert!(build_fal_hunyuan_3d_3p1_pro_state(builder).is_err());
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Quad),
        enable_texture: Some(false),
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Detailed),
        input_mesh: Some(MeshRef::Url("https://example.com/model.glb".to_string())),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_hunyuan_3d_3p1_pro_state(builder).expect("build"),
        FalHunyuan3d3p1ProState::Image(_)
      ));
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1Pro,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  fn image_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      reference_images: Some(ImageListRef::Urls(vec![FRONT_URL.to_string()])),
      ..base_builder()
    }
  }

  fn text_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      prompt: Some("a red ceramic teapot".to_string()),
      ..base_builder()
    }
  }

  fn expect_image(state: FalHunyuan3d3p1ProState) -> FalHunyuan3d3p1ProImageRequestState {
    match state {
      FalHunyuan3d3p1ProState::Image(image) => image,
      FalHunyuan3d3p1ProState::Text(text) => panic!("expected image mode, got text: {text:?}"),
    }
  }

  fn expect_text(state: FalHunyuan3d3p1ProState) -> FalHunyuan3d3p1ProTextRequestState {
    match state {
      FalHunyuan3d3p1ProState::Text(text) => text,
      FalHunyuan3d3p1ProState::Image(image) => panic!("expected text mode, got image: {image:?}"),
    }
  }
}
