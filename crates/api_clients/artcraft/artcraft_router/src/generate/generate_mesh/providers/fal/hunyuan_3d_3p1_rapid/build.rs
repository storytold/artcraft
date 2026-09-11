use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use fal_client::requests::api::mesh::image::hunyuan_3d_3p1_rapid_image_to_mesh::api::Hunyuan3d3p1RapidImageToMeshRequest;
use fal_client::requests::api::mesh::text::hunyuan_3d_3p1_rapid_text_to_mesh::api::Hunyuan3d3p1RapidTextToMeshRequest;

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_rapid::request::{
  FalHunyuan3d3p1RapidImageRequestState, FalHunyuan3d3p1RapidTextRequestState,
};
use crate::generate::generate_mesh::providers::fal::resolve::plan_primary_image_url;
use crate::generate::generate_mesh::providers::reject_unsupported::{
  reject_unsupported_image_ref, reject_unsupported_option,
};

/// Hunyuan 3D v3.1 Rapid combines fal's rapid image-to-3d and text-to-3d
/// endpoints under a single router model. The request shape picks the
/// endpoint: any image input (reference images or `front_image`) dispatches
/// to image-to-3d; otherwise a prompt dispatches to text-to-3d.
pub fn build_fal_hunyuan_3d_3p1_rapid(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_hunyuan_3d_3p1_rapid_state(builder)?;
  let request = match state {
    FalHunyuan3d3p1RapidState::Image(state) => MeshGenerationRequest::FalHunyuan3d3p1RapidImage(state),
    FalHunyuan3d3p1RapidState::Text(state) => MeshGenerationRequest::FalHunyuan3d3p1RapidText(state),
  };
  Ok(MeshGenerationDraftOrRequest::Request(request))
}

/// The endpoint selected by the request shape.
#[derive(Clone, Debug)]
pub(crate) enum FalHunyuan3d3p1RapidState {
  Image(FalHunyuan3d3p1RapidImageRequestState),
  Text(FalHunyuan3d3p1RapidTextRequestState),
}

pub(crate) fn build_fal_hunyuan_3d_3p1_rapid_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalHunyuan3d3p1RapidState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // The rapid schema is minimal: no polygon-type, face-count, texture, or
  // input-mesh parameters.
  reject_unsupported_option("polygon_type", builder.polygon_type.as_ref(), strategy)?;
  reject_unsupported_option("face_count", builder.face_count.as_ref(), strategy)?;
  reject_unsupported_option("enable_texture", builder.enable_texture.as_ref(), strategy)?;
  reject_unsupported_option("texture_quality", builder.texture_quality.as_ref(), strategy)?;
  reject_unsupported_option("geometry_quality", builder.geometry_quality.as_ref(), strategy)?;
  reject_unsupported_option("input_mesh", builder.input_mesh.as_ref(), strategy)?;

  // Rapid is single-image only — no multi-view side images in either mode.
  reject_unsupported_image_ref("back_image", builder.back_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("left_image", builder.left_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("right_image", builder.right_image.as_ref(), strategy)?;

  let maybe_front_url = plan_primary_image_url(
    builder.reference_images.take(),
    builder.front_image.take(),
    strategy,
  )?;
  let enable_geometry = plan_enable_geometry(builder.mesh_output_type, strategy)?;

  match maybe_front_url {
    Some(image_url) => {
      // Image mode. The image endpoint has no prompt parameter.
      reject_unsupported_option("prompt", builder.prompt.as_ref(), strategy)?;

      let request = Hunyuan3d3p1RapidImageToMeshRequest {
        image_url,
        enable_pbr: builder.enable_pbr,
        enable_geometry,
      };
      Ok(FalHunyuan3d3p1RapidState::Image(FalHunyuan3d3p1RapidImageRequestState { request }))
    }
    None => {
      let prompt = builder.prompt.take().ok_or_else(|| {
        ArtcraftRouterError::InvalidInput(
          "Hunyuan 3D v3.1 Rapid requires an input image or a prompt".to_string(),
        )
      })?;

      let request = Hunyuan3d3p1RapidTextToMeshRequest {
        prompt,
        enable_pbr: builder.enable_pbr,
        enable_geometry,
      };
      Ok(FalHunyuan3d3p1RapidState::Text(FalHunyuan3d3p1RapidTextRequestState { request }))
    }
  }
}

// ── Enum mapping helpers ──

/// Rapid has no generation-type enum — geometry-only output is a boolean.
/// `Geometry` maps to `enable_geometry: true`; `Normal` (or unset) leaves it
/// unset (fal defaults to false); `LowPoly` rejects under `ErrorOut` and
/// drops otherwise.
fn plan_enable_geometry(
  mesh_output_type: Option<CommonMeshOutputType>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<bool>, ArtcraftRouterError> {
  match mesh_output_type {
    None | Some(CommonMeshOutputType::Normal) => Ok(None),
    Some(CommonMeshOutputType::Geometry) => Ok(Some(true)),
    Some(CommonMeshOutputType::LowPoly) => {
      reject_unsupported_option("mesh_output_type", Some(&CommonMeshOutputType::LowPoly), strategy)?;
      Ok(None)
    }
  }
}

#[cfg(test)]
mod tests {
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
      let state = build_fal_hunyuan_3d_3p1_rapid_state(image_builder()).expect("build");
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
      let state = build_fal_hunyuan_3d_3p1_rapid_state(builder).expect("build");
      let image = expect_image(state);
      assert_eq!(image.request.image_url, FRONT_URL);
    }

    #[test]
    fn prompt_only_dispatches_to_text_mode() {
      let state = build_fal_hunyuan_3d_3p1_rapid_state(text_builder()).expect("build");
      let text = expect_text(state);
      assert_eq!(text.request.prompt, "a red ceramic teapot");
    }

    #[test]
    fn neither_image_nor_prompt_is_rejected() {
      let result = build_fal_hunyuan_3d_3p1_rapid_state(base_builder());
      assert!(matches!(result, Err(ArtcraftRouterError::InvalidInput(_))));
    }
  }

  mod option_mapping {
    use super::*;

    #[test]
    fn geometry_output_maps_to_enable_geometry() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..image_builder()
      };
      let image = expect_image(build_fal_hunyuan_3d_3p1_rapid_state(builder).expect("build"));
      assert_eq!(image.request.enable_geometry, Some(true));
    }

    #[test]
    fn normal_output_leaves_enable_geometry_unset() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Normal),
        ..image_builder()
      };
      let image = expect_image(build_fal_hunyuan_3d_3p1_rapid_state(builder).expect("build"));
      assert!(image.request.enable_geometry.is_none());
    }

    #[test]
    fn enable_pbr_passes_through_in_both_modes() {
      let image_builder = GenerateMeshRequestBuilder {
        enable_pbr: Some(true),
        ..image_builder()
      };
      let image = expect_image(build_fal_hunyuan_3d_3p1_rapid_state(image_builder).expect("build"));
      assert_eq!(image.request.enable_pbr, Some(true));

      let text_builder = GenerateMeshRequestBuilder {
        enable_pbr: Some(true),
        ..text_builder()
      };
      let text = expect_text(build_fal_hunyuan_3d_3p1_rapid_state(text_builder).expect("build"));
      assert_eq!(text.request.enable_pbr, Some(true));
    }

    #[test]
    fn low_poly_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_hunyuan_3d_3p1_rapid_state(builder).is_err());
    }

    #[test]
    fn low_poly_drops_to_default_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        ..image_builder()
      };
      let image = expect_image(build_fal_hunyuan_3d_3p1_rapid_state(builder).expect("build"));
      assert!(image.request.enable_geometry.is_none());
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn each_unsupported_option_errors_out_under_error_out() {
      let cases: Vec<fn(&mut GenerateMeshRequestBuilder)> = vec![
        |b| b.polygon_type = Some(CommonPolygonType::Quad),
        |b| b.face_count = Some(100_000),
        |b| b.enable_texture = Some(false),
        |b| b.input_mesh = Some(MeshRef::Url("https://example.com/model.glb".to_string())),
        |b| b.back_image = Some(ImageRef::Url(BACK_URL.to_string())),
        |b| b.left_image = Some(ImageRef::Url(BACK_URL.to_string())),
        |b| b.right_image = Some(ImageRef::Url(BACK_URL.to_string())),
      ];
      for (index, set) in cases.into_iter().enumerate() {
        let mut builder = GenerateMeshRequestBuilder {
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
          ..image_builder()
        };
        set(&mut builder);
        assert!(build_fal_hunyuan_3d_3p1_rapid_state(builder).is_err(), "for case {index}");
      }
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Quad),
        face_count: Some(100_000),
        back_image: Some(ImageRef::Url(BACK_URL.to_string())),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_hunyuan_3d_3p1_rapid_state(builder).expect("build"),
        FalHunyuan3d3p1RapidState::Image(_)
      ));
    }

    #[test]
    fn prompt_with_image_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_hunyuan_3d_3p1_rapid_state(builder).is_err());
    }

    #[test]
    fn prompt_with_image_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_hunyuan_3d_3p1_rapid_state(builder).expect("build"),
        FalHunyuan3d3p1RapidState::Image(_)
      ));
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1Rapid,
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

  fn expect_image(state: FalHunyuan3d3p1RapidState) -> FalHunyuan3d3p1RapidImageRequestState {
    match state {
      FalHunyuan3d3p1RapidState::Image(image) => image,
      FalHunyuan3d3p1RapidState::Text(text) => panic!("expected image mode, got text: {text:?}"),
    }
  }

  fn expect_text(state: FalHunyuan3d3p1RapidState) -> FalHunyuan3d3p1RapidTextRequestState {
    match state {
      FalHunyuan3d3p1RapidState::Text(text) => text,
      FalHunyuan3d3p1RapidState::Image(image) => panic!("expected text mode, got image: {image:?}"),
    }
  }
}
