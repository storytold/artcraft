use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use enums::common::generation::common_polygon_type::CommonPolygonType;
use fal_client::requests::api::mesh::image::meshy_v6_image_to_mesh::api::MeshyV6ImageToMeshRequest;
use fal_client::requests::api::mesh::text::meshy_v6_text_to_mesh::api::{
  MeshyV6ModelType, MeshyV6TextToMeshRequest, MeshyV6Topology,
};

use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::meshy_v6::request::{
  FalMeshyV6ImageRequestState, FalMeshyV6TextRequestState,
};
use crate::generate::generate_mesh::providers::fal::resolve::{
  plan_face_count, plan_primary_image_url,
};
use crate::generate::generate_mesh::providers::reject_unsupported::{
  reject_unsupported_image_ref, reject_unsupported_option,
};

/// Meshy 6 combines fal's image-to-3d and text-to-3d endpoints under a single
/// router model. The request shape picks the endpoint: any primary image
/// input dispatches to image-to-3d; otherwise a prompt dispatches to
/// text-to-3d. Neither endpoint takes side-view images or an input mesh.
pub fn build_fal_meshy_v6(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_meshy_v6_state(builder)?;
  let request = match state {
    FalMeshyV6State::Image(state) => MeshGenerationRequest::FalMeshyV6Image(state),
    FalMeshyV6State::Text(state) => MeshGenerationRequest::FalMeshyV6Text(state),
  };
  Ok(MeshGenerationDraftOrRequest::Request(request))
}

/// The endpoint selected by the request shape.
#[derive(Clone, Debug)]
pub(crate) enum FalMeshyV6State {
  Image(FalMeshyV6ImageRequestState),
  Text(FalMeshyV6TextRequestState),
}

pub(crate) fn build_fal_meshy_v6_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalMeshyV6State, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Options neither Meshy 6 endpoint supports.
  reject_unsupported_option("texture_quality", builder.texture_quality.as_ref(), strategy)?;
  reject_unsupported_option("geometry_quality", builder.geometry_quality.as_ref(), strategy)?;
  reject_unsupported_option("input_mesh", builder.input_mesh.as_ref(), strategy)?;
  reject_unsupported_image_ref("back_image", builder.back_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("left_image", builder.left_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("right_image", builder.right_image.as_ref(), strategy)?;

  let maybe_image_url = plan_primary_image_url(
    builder.reference_images.take(),
    builder.front_image.take(),
    strategy,
  )?;
  let target_polycount = plan_face_count(builder.face_count, strategy)?;
  let topology = builder.polygon_type.map(to_topology);

  match maybe_image_url {
    Some(image_url) => {
      // Image mode. The image endpoint has no prompt parameter.
      reject_unsupported_option("prompt", builder.prompt.as_ref(), strategy)?;

      let request = MeshyV6ImageToMeshRequest {
        image_url,
        model_type: plan_image_model_type(builder.mesh_output_type),
        topology,
        target_polycount,
        symmetry_mode: None,
        should_remesh: None,
        should_texture: plan_should_texture(builder.mesh_output_type, builder.enable_texture),
        enable_pbr: builder.enable_pbr,
        pose_mode: None,
        texture_prompt: None,
        texture_image_url: None,
        enable_rigging: None,
        rigging_height_meters: None,
        enable_animation: None,
        animation_action_id: None,
        enable_safety_checker: None,
      };
      Ok(FalMeshyV6State::Image(FalMeshyV6ImageRequestState { request }))
    }
    None => {
      // Text mode. The text endpoint always textures, so `enable_texture`
      // has no equivalent parameter.
      reject_unsupported_option("enable_texture", builder.enable_texture.as_ref(), strategy)?;

      let prompt = builder.prompt.take().ok_or_else(|| {
        ArtcraftRouterError::InvalidInput(
          "Meshy 6 requires an input image or a prompt".to_string(),
        )
      })?;

      let request = MeshyV6TextToMeshRequest {
        prompt,
        mode: None,
        seed: None,
        model_type: plan_text_model_type(builder.mesh_output_type, strategy)?,
        topology,
        target_polycount,
        should_remesh: None,
        symmetry_mode: None,
        enable_pbr: builder.enable_pbr,
        pose_mode: None,
        enable_prompt_expansion: None,
        texture_prompt: None,
        texture_image_url: None,
        enable_rigging: None,
        rigging_height_meters: None,
        enable_animation: None,
        animation_action_id: None,
        enable_safety_checker: None,
      };
      Ok(FalMeshyV6State::Text(FalMeshyV6TextRequestState { request }))
    }
  }
}

// ── Option planning helpers ──

/// Map the output type onto the image endpoint's `model_type`. `Geometry`
/// is expressed via `should_texture` instead, so only `LowPoly` maps here.
fn plan_image_model_type(
  mesh_output_type: Option<CommonMeshOutputType>,
) -> Option<MeshyV6ModelType> {
  match mesh_output_type {
    Some(CommonMeshOutputType::LowPoly) => Some(MeshyV6ModelType::LowPoly),
    None | Some(CommonMeshOutputType::Normal) | Some(CommonMeshOutputType::Geometry) => None,
  }
}

/// Map the output type onto the text endpoint's `model_type`. The text
/// endpoint cannot skip texturing, so `Geometry` rejects under `ErrorOut`
/// and is dropped otherwise.
fn plan_text_model_type(
  mesh_output_type: Option<CommonMeshOutputType>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<MeshyV6ModelType>, ArtcraftRouterError> {
  match mesh_output_type {
    None | Some(CommonMeshOutputType::Normal) => Ok(None),
    Some(CommonMeshOutputType::LowPoly) => Ok(Some(MeshyV6ModelType::LowPoly)),
    Some(CommonMeshOutputType::Geometry) => {
      reject_unsupported_option(
        "mesh_output_type",
        Some(&CommonMeshOutputType::Geometry),
        strategy,
      )?;
      Ok(None)
    }
  }
}

/// A geometry-only output type or an explicit `enable_texture: false` both
/// map to the image endpoint's `should_texture: false`.
fn plan_should_texture(
  mesh_output_type: Option<CommonMeshOutputType>,
  enable_texture: Option<bool>,
) -> Option<bool> {
  let skip_texturing = matches!(mesh_output_type, Some(CommonMeshOutputType::Geometry))
    || enable_texture == Some(false);
  if skip_texturing {
    Some(false)
  } else {
    None
  }
}

fn to_topology(polygon_type: CommonPolygonType) -> MeshyV6Topology {
  match polygon_type {
    CommonPolygonType::Quad => MeshyV6Topology::Quad,
    CommonPolygonType::Triangle => MeshyV6Topology::Triangle,
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_quality::CommonMeshQuality;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::mesh_ref::MeshRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::errors::client_error::ClientError;

  use super::*;

  const FRONT_URL: &str = "https://example.com/front.png";
  const PROMPT: &str = "a red ceramic teapot";

  mod shape_dispatch {
    use super::*;

    #[test]
    fn reference_image_dispatches_to_image_mode() {
      let state = build_fal_meshy_v6_state(image_builder()).expect("build");
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
      let state = build_fal_meshy_v6_state(builder).expect("build");
      let image = expect_image(state);
      assert_eq!(image.request.image_url, FRONT_URL);
    }

    #[test]
    fn prompt_only_dispatches_to_text_mode() {
      let state = build_fal_meshy_v6_state(text_builder()).expect("build");
      let text = expect_text(state);
      assert_eq!(text.request.prompt, PROMPT);
    }

    #[test]
    fn neither_image_nor_prompt_is_rejected() {
      let result = build_fal_meshy_v6_state(base_builder());
      assert!(matches!(result, Err(ArtcraftRouterError::InvalidInput(_))));
    }

    #[test]
    fn media_tokens_are_rejected() {
      let builder = GenerateMeshRequestBuilder {
        reference_images: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_test123".to_string()),
        ])),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_meshy_v6_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }
  }

  mod image_mode {
    use super::*;

    #[test]
    fn geometry_output_sets_should_texture_false() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..image_builder()
      };
      let image = expect_image(build_fal_meshy_v6_state(builder).expect("build"));
      assert_eq!(image.request.should_texture, Some(false));
      assert_eq!(image.request.model_type, None);
    }

    #[test]
    fn enable_texture_false_sets_should_texture_false() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        ..image_builder()
      };
      let image = expect_image(build_fal_meshy_v6_state(builder).expect("build"));
      assert_eq!(image.request.should_texture, Some(false));
    }

    #[test]
    fn should_texture_is_unset_by_default() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(true),
        ..image_builder()
      };
      let image = expect_image(build_fal_meshy_v6_state(builder).expect("build"));
      assert_eq!(image.request.should_texture, None);
    }

    #[test]
    fn low_poly_maps_to_model_type() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        ..image_builder()
      };
      let image = expect_image(build_fal_meshy_v6_state(builder).expect("build"));
      assert_eq!(image.request.model_type, Some(MeshyV6ModelType::LowPoly));
      assert_eq!(image.request.should_texture, None);
    }

    #[test]
    fn options_map_through() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Quad),
        face_count: Some(100_000),
        enable_pbr: Some(true),
        ..image_builder()
      };
      let image = expect_image(build_fal_meshy_v6_state(builder).expect("build"));
      assert_eq!(image.request.topology, Some(MeshyV6Topology::Quad));
      assert_eq!(image.request.target_polycount, Some(100_000));
      assert_eq!(image.request.enable_pbr, Some(true));
    }

    #[test]
    fn prompt_with_image_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some(PROMPT.to_string()),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_meshy_v6_state(builder).is_err());
    }

    #[test]
    fn prompt_with_image_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some(PROMPT.to_string()),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_meshy_v6_state(builder).expect("build"),
        FalMeshyV6State::Image(_)
      ));
    }
  }

  mod text_mode {
    use super::*;

    #[test]
    fn options_map_through() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        polygon_type: Some(CommonPolygonType::Triangle),
        face_count: Some(40_000),
        enable_pbr: Some(false),
        ..text_builder()
      };
      let text = expect_text(build_fal_meshy_v6_state(builder).expect("build"));
      assert_eq!(text.request.model_type, Some(MeshyV6ModelType::LowPoly));
      assert_eq!(text.request.topology, Some(MeshyV6Topology::Triangle));
      assert_eq!(text.request.target_polycount, Some(40_000));
      assert_eq!(text.request.enable_pbr, Some(false));
    }

    #[test]
    fn geometry_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..text_builder()
      };
      assert!(build_fal_meshy_v6_state(builder).is_err());
    }

    #[test]
    fn geometry_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..text_builder()
      };
      let text = expect_text(build_fal_meshy_v6_state(builder).expect("build"));
      assert_eq!(text.request.model_type, None);
    }

    #[test]
    fn enable_texture_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..text_builder()
      };
      assert!(build_fal_meshy_v6_state(builder).is_err());
    }

    #[test]
    fn enable_texture_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        ..text_builder()
      };
      assert!(matches!(
        build_fal_meshy_v6_state(builder).expect("build"),
        FalMeshyV6State::Text(_)
      ));
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn texture_quality_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_meshy_v6_state(builder).is_err());
    }

    #[test]
    fn geometry_quality_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        geometry_quality: Some(CommonMeshQuality::Detailed),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_meshy_v6_state(builder).is_err());
    }

    #[test]
    fn input_mesh_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        input_mesh: Some(MeshRef::Url("https://example.com/mesh.glb".to_string())),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_meshy_v6_state(builder).is_err());
    }

    #[test]
    fn side_images_error_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::Url("https://example.com/back.png".to_string())),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_meshy_v6_state(builder).is_err());
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Standard),
        input_mesh: Some(MeshRef::Url("https://example.com/mesh.glb".to_string())),
        back_image: Some(ImageRef::Url("https://example.com/back.png".to_string())),
        left_image: Some(ImageRef::Url("https://example.com/left.png".to_string())),
        right_image: Some(ImageRef::Url("https://example.com/right.png".to_string())),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_meshy_v6_state(builder).expect("build"),
        FalMeshyV6State::Image(_)
      ));
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::MeshyV6,
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
      prompt: Some(PROMPT.to_string()),
      ..base_builder()
    }
  }

  fn expect_image(state: FalMeshyV6State) -> FalMeshyV6ImageRequestState {
    match state {
      FalMeshyV6State::Image(image) => image,
      FalMeshyV6State::Text(text) => panic!("expected image mode, got text: {text:?}"),
    }
  }

  fn expect_text(state: FalMeshyV6State) -> FalMeshyV6TextRequestState {
    match state {
      FalMeshyV6State::Text(text) => text,
      FalMeshyV6State::Image(image) => panic!("expected text mode, got image: {image:?}"),
    }
  }
}
