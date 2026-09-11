use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use enums::common::generation::common_polygon_type::CommonPolygonType;
use fal_client::requests::api::mesh::image::hunyuan3d_3_image_to_mesh::api::{
  Hunyuan3d3ImageToMeshGenerateType, Hunyuan3d3ImageToMeshPolygonType, Hunyuan3d3ImageToMeshRequest,
};
use fal_client::requests::api::mesh::text::hunyuan3d_3_text_to_mesh::api::{
  Hunyuan3d3TextToMeshGenerateType, Hunyuan3d3TextToMeshPolygonType, Hunyuan3d3TextToMeshRequest,
};

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::request::{
  FalHunyuan3d3ImageRequestState, FalHunyuan3d3TextRequestState,
};
use crate::generate::generate_mesh::providers::fal::resolve::{
  plan_face_count, plan_primary_image_url, plan_side_image_url,
};
use crate::generate::generate_mesh::providers::reject_unsupported::{
  reject_unsupported_image_ref, reject_unsupported_option,
};

/// Hunyuan 3D v3 combines fal's image-to-3d and text-to-3d endpoints under a
/// single router model. The request shape picks the endpoint: any image input
/// (reference images or `front_image`) dispatches to image-to-3d; otherwise a
/// prompt dispatches to text-to-3d.
pub fn build_fal_hunyuan3d_3(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_hunyuan3d_3_state(builder)?;
  let request = match state {
    FalHunyuan3d3State::Image(state) => MeshGenerationRequest::FalHunyuan3d3Image(state),
    FalHunyuan3d3State::Text(state) => MeshGenerationRequest::FalHunyuan3d3Text(state),
  };
  Ok(MeshGenerationDraftOrRequest::Request(request))
}

/// The endpoint selected by the request shape.
#[derive(Clone, Debug)]
pub(crate) enum FalHunyuan3d3State {
  Image(FalHunyuan3d3ImageRequestState),
  Text(FalHunyuan3d3TextRequestState),
}

pub(crate) fn build_fal_hunyuan3d_3_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalHunyuan3d3State, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

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

      let request = Hunyuan3d3ImageToMeshRequest {
        image_url,
        back_image_url: plan_side_image_url(builder.back_image.take())?,
        left_image_url: plan_side_image_url(builder.left_image.take())?,
        right_image_url: plan_side_image_url(builder.right_image.take())?,
        face_count,
        generate_type: builder.mesh_output_type.map(to_image_generate_type),
        polygon_type: builder.polygon_type.map(to_image_polygon_type),
        enable_pbr: builder.enable_pbr,
      };
      Ok(FalHunyuan3d3State::Image(FalHunyuan3d3ImageRequestState { request }))
    }
    None => {
      // Text mode. Multi-view side images only make sense alongside a front
      // image, so they're unsupported here.
      reject_unsupported_image_ref("back_image", builder.back_image.as_ref(), strategy)?;
      reject_unsupported_image_ref("left_image", builder.left_image.as_ref(), strategy)?;
      reject_unsupported_image_ref("right_image", builder.right_image.as_ref(), strategy)?;

      let prompt = builder.prompt.take().ok_or_else(|| {
        ArtcraftRouterError::InvalidInput(
          "Hunyuan 3D v3 requires an input image or a prompt".to_string(),
        )
      })?;

      let request = Hunyuan3d3TextToMeshRequest {
        prompt,
        face_count,
        generate_type: builder.mesh_output_type.map(to_text_generate_type),
        polygon_type: builder.polygon_type.map(to_text_polygon_type),
        enable_pbr: builder.enable_pbr,
      };
      Ok(FalHunyuan3d3State::Text(FalHunyuan3d3TextRequestState { request }))
    }
  }
}

// ── Enum mapping helpers ──

fn to_image_generate_type(output_type: CommonMeshOutputType) -> Hunyuan3d3ImageToMeshGenerateType {
  match output_type {
    CommonMeshOutputType::Normal => Hunyuan3d3ImageToMeshGenerateType::Normal,
    CommonMeshOutputType::LowPoly => Hunyuan3d3ImageToMeshGenerateType::LowPoly,
    CommonMeshOutputType::Geometry => Hunyuan3d3ImageToMeshGenerateType::Geometry,
  }
}

fn to_image_polygon_type(polygon_type: CommonPolygonType) -> Hunyuan3d3ImageToMeshPolygonType {
  match polygon_type {
    CommonPolygonType::Triangle => Hunyuan3d3ImageToMeshPolygonType::Triangle,
    CommonPolygonType::Quad => Hunyuan3d3ImageToMeshPolygonType::Quadrilateral,
  }
}

fn to_text_generate_type(output_type: CommonMeshOutputType) -> Hunyuan3d3TextToMeshGenerateType {
  match output_type {
    CommonMeshOutputType::Normal => Hunyuan3d3TextToMeshGenerateType::Normal,
    CommonMeshOutputType::LowPoly => Hunyuan3d3TextToMeshGenerateType::LowPoly,
    CommonMeshOutputType::Geometry => Hunyuan3d3TextToMeshGenerateType::Geometry,
  }
}

fn to_text_polygon_type(polygon_type: CommonPolygonType) -> Hunyuan3d3TextToMeshPolygonType {
  match polygon_type {
    CommonPolygonType::Triangle => Hunyuan3d3TextToMeshPolygonType::Triangle,
    CommonPolygonType::Quad => Hunyuan3d3TextToMeshPolygonType::Quadrilateral,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::errors::client_error::ClientError;

  use super::*;

  const FRONT_URL: &str = "https://example.com/front.png";
  const BACK_URL: &str = "https://example.com/back.png";

  mod shape_dispatch {
    use super::*;

    #[test]
    fn reference_image_dispatches_to_image_mode() {
      let state = build_fal_hunyuan3d_3_state(image_builder()).expect("build");
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
      let state = build_fal_hunyuan3d_3_state(builder).expect("build");
      let image = expect_image(state);
      assert_eq!(image.request.image_url, FRONT_URL);
    }

    #[test]
    fn prompt_only_dispatches_to_text_mode() {
      let state = build_fal_hunyuan3d_3_state(text_builder()).expect("build");
      let text = expect_text(state);
      assert_eq!(text.request.prompt, "a red ceramic teapot");
    }

    #[test]
    fn neither_image_nor_prompt_is_rejected() {
      let result = build_fal_hunyuan3d_3_state(base_builder());
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
      let image = expect_image(build_fal_hunyuan3d_3_state(builder).expect("build"));
      assert_eq!(image.request.back_image_url.as_deref(), Some(BACK_URL));
      assert_eq!(image.request.left_image_url.as_deref(), Some("https://example.com/left.png"));
      assert_eq!(image.request.right_image_url.as_deref(), Some("https://example.com/right.png"));
    }

    #[test]
    fn options_map_through() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        polygon_type: Some(CommonPolygonType::Quad),
        face_count: Some(100_000),
        enable_pbr: Some(true),
        ..image_builder()
      };
      let image = expect_image(build_fal_hunyuan3d_3_state(builder).expect("build"));
      assert!(matches!(image.request.generate_type, Some(Hunyuan3d3ImageToMeshGenerateType::LowPoly)));
      assert!(matches!(image.request.polygon_type, Some(Hunyuan3d3ImageToMeshPolygonType::Quadrilateral)));
      assert_eq!(image.request.face_count, Some(100_000));
      assert_eq!(image.request.enable_pbr, Some(true));
    }

    #[test]
    fn prompt_with_image_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_hunyuan3d_3_state(builder).is_err());
    }

    #[test]
    fn prompt_with_image_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_hunyuan3d_3_state(builder).expect("build"),
        FalHunyuan3d3State::Image(_)
      ));
    }

    #[test]
    fn media_tokens_are_rejected() {
      use tokens::tokens::media_files::MediaFileToken;
      let builder = GenerateMeshRequestBuilder {
        reference_images: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_test123".to_string()),
        ])),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_hunyuan3d_3_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }
  }

  mod text_mode {
    use super::*;

    #[test]
    fn options_map_through() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        polygon_type: Some(CommonPolygonType::Triangle),
        face_count: Some(40_000),
        enable_pbr: Some(false),
        ..text_builder()
      };
      let text = expect_text(build_fal_hunyuan3d_3_state(builder).expect("build"));
      assert!(matches!(text.request.generate_type, Some(Hunyuan3d3TextToMeshGenerateType::Geometry)));
      assert!(matches!(text.request.polygon_type, Some(Hunyuan3d3TextToMeshPolygonType::Triangle)));
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
      assert!(build_fal_hunyuan3d_3_state(builder).is_err());
    }

    #[test]
    fn side_images_without_front_are_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::Url(BACK_URL.to_string())),
        ..text_builder()
      };
      assert!(matches!(
        build_fal_hunyuan3d_3_state(builder).expect("build"),
        FalHunyuan3d3State::Text(_)
      ));
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3,
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

  fn expect_image(state: FalHunyuan3d3State) -> FalHunyuan3d3ImageRequestState {
    match state {
      FalHunyuan3d3State::Image(image) => image,
      FalHunyuan3d3State::Text(text) => panic!("expected image mode, got text: {text:?}"),
    }
  }

  fn expect_text(state: FalHunyuan3d3State) -> FalHunyuan3d3TextRequestState {
    match state {
      FalHunyuan3d3State::Text(text) => text,
      FalHunyuan3d3State::Image(image) => panic!("expected text mode, got image: {image:?}"),
    }
  }
}
