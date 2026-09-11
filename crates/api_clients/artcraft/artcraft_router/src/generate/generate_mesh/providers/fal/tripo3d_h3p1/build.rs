use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use enums::common::generation::common_mesh_quality::CommonMeshQuality;
use enums::common::generation::common_polygon_type::CommonPolygonType;
use fal_client::requests::api::mesh::image::tripo3d_h3p1_image_to_mesh::api::{
  Tripo3dH3p1ImageGeometryQuality, Tripo3dH3p1ImageTextureQuality, Tripo3dH3p1ImageToMeshRequest,
};
use fal_client::requests::api::mesh::multiview::tripo3d_h3p1_multiview_to_mesh::api::Tripo3dH3p1MultiviewToMeshRequest;
use fal_client::requests::api::mesh::text::tripo3d_h3p1_text_to_mesh::api::{
  Tripo3dH3p1GeometryQuality, Tripo3dH3p1TextToMeshRequest, Tripo3dH3p1TextureQuality,
};

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::resolve::{
  plan_face_count, plan_primary_image_url, plan_side_image_url,
};
use crate::generate::generate_mesh::providers::fal::tripo3d_h3p1::request::{
  FalTripo3dH3p1ImageRequestState, FalTripo3dH3p1MultiviewRequestState,
  FalTripo3dH3p1TextRequestState,
};
use crate::generate::generate_mesh::providers::reject_unsupported::reject_unsupported_option;

/// Tripo3D H3.1 combines fal's text-to-3d, image-to-3d, and multiview-to-3d
/// endpoints under a single router model. The request shape picks the
/// endpoint: any side-view image (back/left/right) dispatches to
/// multiview-to-3d (which also requires a front image); otherwise a primary
/// image dispatches to image-to-3d; otherwise a prompt dispatches to
/// text-to-3d.
pub fn build_fal_tripo3d_h3p1(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_tripo3d_h3p1_state(builder)?;
  let request = match state {
    FalTripo3dH3p1State::Multiview(state) => MeshGenerationRequest::FalTripo3dH3p1Multiview(state),
    FalTripo3dH3p1State::Image(state) => MeshGenerationRequest::FalTripo3dH3p1Image(state),
    FalTripo3dH3p1State::Text(state) => MeshGenerationRequest::FalTripo3dH3p1Text(state),
  };
  Ok(MeshGenerationDraftOrRequest::Request(request))
}

/// The endpoint selected by the request shape.
#[derive(Clone, Debug)]
pub(crate) enum FalTripo3dH3p1State {
  Multiview(FalTripo3dH3p1MultiviewRequestState),
  Image(FalTripo3dH3p1ImageRequestState),
  Text(FalTripo3dH3p1TextRequestState),
}

pub(crate) fn build_fal_tripo3d_h3p1_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalTripo3dH3p1State, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // No Tripo3D endpoint takes a mesh input.
  reject_unsupported_option("input_mesh", builder.input_mesh.as_ref(), strategy)?;

  let maybe_front_url = plan_primary_image_url(
    builder.reference_images.take(),
    builder.front_image.take(),
    strategy,
  )?;
  let maybe_left_url = plan_side_image_url(builder.left_image.take())?;
  let maybe_back_url = plan_side_image_url(builder.back_image.take())?;
  let maybe_right_url = plan_side_image_url(builder.right_image.take())?;

  let options = plan_tripo3d_options(&mut builder)?;

  let has_side_view = maybe_left_url.is_some()
    || maybe_back_url.is_some()
    || maybe_right_url.is_some();

  if has_side_view {
    // Multiview mode. The endpoint reconstructs from 2-4 views, and the
    // front view anchors the set, so it's required.
    let front_url = maybe_front_url.ok_or_else(|| {
      ArtcraftRouterError::InvalidInput(
        "Tripo3D multi-view input requires a front/reference image".to_string(),
      )
    })?;
    // The multiview endpoint has no prompt parameter.
    reject_unsupported_option("prompt", builder.prompt.as_ref(), strategy)?;

    // fal's canonical view order is [front, left, back, right]; absent views
    // are simply omitted.
    let mut image_urls = vec![front_url];
    image_urls.extend(maybe_left_url);
    image_urls.extend(maybe_back_url);
    image_urls.extend(maybe_right_url);

    let request = Tripo3dH3p1MultiviewToMeshRequest {
      image_urls,
      face_limit: options.face_limit,
      texture: options.texture,
      pbr: options.pbr,
      model_seed: None,
      texture_seed: None,
      texture_quality: options.texture_quality.map(to_image_texture_quality),
      geometry_quality: options.geometry_quality.map(to_image_geometry_quality),
      texture_alignment: None,
      auto_size: None,
      orientation: None,
      quad: options.quad,
    };
    Ok(FalTripo3dH3p1State::Multiview(FalTripo3dH3p1MultiviewRequestState { request }))
  } else if let Some(image_url) = maybe_front_url {
    // Image mode. The image endpoint has no prompt parameter.
    reject_unsupported_option("prompt", builder.prompt.as_ref(), strategy)?;

    let request = Tripo3dH3p1ImageToMeshRequest {
      image_url,
      face_limit: options.face_limit,
      texture: options.texture,
      pbr: options.pbr,
      model_seed: None,
      texture_seed: None,
      texture_quality: options.texture_quality.map(to_image_texture_quality),
      geometry_quality: options.geometry_quality.map(to_image_geometry_quality),
      texture_alignment: None,
      auto_size: None,
      orientation: None,
      quad: options.quad,
    };
    Ok(FalTripo3dH3p1State::Image(FalTripo3dH3p1ImageRequestState { request }))
  } else {
    // Text mode.
    let prompt = builder.prompt.take().ok_or_else(|| {
      ArtcraftRouterError::InvalidInput(
        "Tripo3D H3.1 requires an input image or a prompt".to_string(),
      )
    })?;

    let request = Tripo3dH3p1TextToMeshRequest {
      prompt,
      negative_prompt: None,
      face_limit: options.face_limit,
      texture: options.texture,
      pbr: options.pbr,
      model_seed: None,
      image_seed: None,
      texture_seed: None,
      texture_quality: options.texture_quality.map(to_text_texture_quality),
      geometry_quality: options.geometry_quality.map(to_text_geometry_quality),
      auto_size: None,
      quad: options.quad,
    };
    Ok(FalTripo3dH3p1State::Text(FalTripo3dH3p1TextRequestState { request }))
  }
}

/// Options shared by all three Tripo3D H3.1 endpoints, resolved from the
/// builder once and mapped onto each endpoint's field types per-mode.
struct Tripo3dH3p1Options {
  face_limit: Option<u32>,
  texture: Option<bool>,
  pbr: Option<bool>,
  texture_quality: Option<CommonMeshQuality>,
  geometry_quality: Option<CommonMeshQuality>,
  quad: Option<bool>,
}

fn plan_tripo3d_options(
  builder: &mut GenerateMeshRequestBuilder,
) -> Result<Tripo3dH3p1Options, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Tripo3D has no low-poly output mode; `Normal` and `Geometry` map onto the
  // texture flags below.
  if matches!(builder.mesh_output_type, Some(CommonMeshOutputType::LowPoly)) {
    reject_unsupported_option("mesh_output_type", builder.mesh_output_type.as_ref(), strategy)?;
  }

  // A geometry-only output (or explicitly disabled texturing) maps to the
  // untextured tier — unless PBR is explicitly requested, since PBR implies
  // texturing. Both flags default to true on fal's side and either one alone
  // re-enables texturing, so both must be explicitly disabled together to
  // reach the untextured billing tier.
  let wants_untextured = matches!(builder.mesh_output_type, Some(CommonMeshOutputType::Geometry))
    || builder.enable_texture == Some(false);
  let texture_off = wants_untextured && builder.enable_pbr != Some(true);
  let (texture, pbr) = if texture_off {
    (Some(false), Some(false))
  } else {
    (builder.enable_texture, builder.enable_pbr)
  };

  let quad = builder.polygon_type.take().map(|polygon_type| match polygon_type {
    CommonPolygonType::Quad => true,
    CommonPolygonType::Triangle => false,
  });

  Ok(Tripo3dH3p1Options {
    face_limit: plan_face_count(builder.face_count, strategy)?,
    texture,
    pbr,
    texture_quality: builder.texture_quality.take(),
    geometry_quality: builder.geometry_quality.take(),
    quad,
  })
}

// ── Enum mapping helpers ──

fn to_text_texture_quality(quality: CommonMeshQuality) -> Tripo3dH3p1TextureQuality {
  match quality {
    CommonMeshQuality::Standard => Tripo3dH3p1TextureQuality::Standard,
    CommonMeshQuality::Detailed => Tripo3dH3p1TextureQuality::Detailed,
  }
}

fn to_text_geometry_quality(quality: CommonMeshQuality) -> Tripo3dH3p1GeometryQuality {
  match quality {
    CommonMeshQuality::Standard => Tripo3dH3p1GeometryQuality::Standard,
    CommonMeshQuality::Detailed => Tripo3dH3p1GeometryQuality::Detailed,
  }
}

fn to_image_texture_quality(quality: CommonMeshQuality) -> Tripo3dH3p1ImageTextureQuality {
  match quality {
    CommonMeshQuality::Standard => Tripo3dH3p1ImageTextureQuality::Standard,
    CommonMeshQuality::Detailed => Tripo3dH3p1ImageTextureQuality::Detailed,
  }
}

fn to_image_geometry_quality(quality: CommonMeshQuality) -> Tripo3dH3p1ImageGeometryQuality {
  match quality {
    CommonMeshQuality::Standard => Tripo3dH3p1ImageGeometryQuality::Standard,
    CommonMeshQuality::Detailed => Tripo3dH3p1ImageGeometryQuality::Detailed,
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::mesh_ref::MeshRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::errors::client_error::ClientError;

  use super::*;

  const FRONT_URL: &str = "https://example.com/front.png";
  const LEFT_URL: &str = "https://example.com/left.png";
  const BACK_URL: &str = "https://example.com/back.png";
  const RIGHT_URL: &str = "https://example.com/right.png";

  mod shape_dispatch {
    use super::*;

    #[test]
    fn reference_image_dispatches_to_image_mode() {
      let state = build_fal_tripo3d_h3p1_state(image_builder()).expect("build");
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
      let image = expect_image(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(image.request.image_url, FRONT_URL);
    }

    #[test]
    fn prompt_only_dispatches_to_text_mode() {
      let state = build_fal_tripo3d_h3p1_state(text_builder()).expect("build");
      let text = expect_text(state);
      assert_eq!(text.request.prompt, "a red ceramic teapot");
    }

    #[test]
    fn side_image_dispatches_to_multiview_mode() {
      let builder = GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::Url(BACK_URL.to_string())),
        ..image_builder()
      };
      let multiview = expect_multiview(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(multiview.request.image_urls, vec![FRONT_URL, BACK_URL]);
    }

    #[test]
    fn side_images_without_front_are_rejected() {
      // A hard error even under the (default) lenient strategy: the endpoint
      // cannot anchor the view set without a front image.
      let builder = GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::Url(BACK_URL.to_string())),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_tripo3d_h3p1_state(builder),
        Err(ArtcraftRouterError::InvalidInput(_))
      ));
    }

    #[test]
    fn neither_image_nor_prompt_is_rejected() {
      let result = build_fal_tripo3d_h3p1_state(base_builder());
      assert!(matches!(result, Err(ArtcraftRouterError::InvalidInput(_))));
    }
  }

  mod multiview_mode {
    use super::*;

    #[test]
    fn urls_follow_canonical_view_order() {
      let builder = GenerateMeshRequestBuilder {
        left_image: Some(ImageRef::Url(LEFT_URL.to_string())),
        back_image: Some(ImageRef::Url(BACK_URL.to_string())),
        right_image: Some(ImageRef::Url(RIGHT_URL.to_string())),
        ..image_builder()
      };
      let multiview = expect_multiview(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(
        multiview.request.image_urls,
        vec![FRONT_URL, LEFT_URL, BACK_URL, RIGHT_URL],
      );
    }

    #[test]
    fn missing_views_are_omitted() {
      let builder = GenerateMeshRequestBuilder {
        back_image: Some(ImageRef::Url(BACK_URL.to_string())),
        right_image: Some(ImageRef::Url(RIGHT_URL.to_string())),
        ..image_builder()
      };
      let multiview = expect_multiview(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(multiview.request.image_urls, vec![FRONT_URL, BACK_URL, RIGHT_URL]);
    }

    #[test]
    fn options_map_through() {
      let builder = GenerateMeshRequestBuilder {
        face_count: Some(100_000),
        polygon_type: Some(CommonPolygonType::Quad),
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Detailed),
        ..multiview_builder()
      };
      let multiview = expect_multiview(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(multiview.request.face_limit, Some(100_000));
      assert_eq!(multiview.request.quad, Some(true));
      assert_eq!(multiview.request.texture_quality, Some(Tripo3dH3p1ImageTextureQuality::Detailed));
      assert_eq!(multiview.request.geometry_quality, Some(Tripo3dH3p1ImageGeometryQuality::Detailed));
    }

    #[test]
    fn prompt_with_multiview_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..multiview_builder()
      };
      assert!(build_fal_tripo3d_h3p1_state(builder).is_err());
    }

    #[test]
    fn prompt_with_multiview_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        ..multiview_builder()
      };
      assert!(matches!(
        build_fal_tripo3d_h3p1_state(builder).expect("build"),
        FalTripo3dH3p1State::Multiview(_)
      ));
    }
  }

  mod image_mode {
    use super::*;

    #[test]
    fn options_map_through() {
      let builder = GenerateMeshRequestBuilder {
        face_count: Some(50_000),
        polygon_type: Some(CommonPolygonType::Quad),
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Standard),
        ..image_builder()
      };
      let image = expect_image(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(image.request.face_limit, Some(50_000));
      assert_eq!(image.request.quad, Some(true));
      assert_eq!(image.request.texture_quality, Some(Tripo3dH3p1ImageTextureQuality::Detailed));
      assert_eq!(image.request.geometry_quality, Some(Tripo3dH3p1ImageGeometryQuality::Standard));
    }

    #[test]
    fn prompt_with_image_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_tripo3d_h3p1_state(builder).is_err());
    }

    #[test]
    fn prompt_with_image_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_tripo3d_h3p1_state(builder).expect("build"),
        FalTripo3dH3p1State::Image(_)
      ));
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
        build_fal_tripo3d_h3p1_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }
  }

  mod text_mode {
    use super::*;

    #[test]
    fn options_map_through() {
      let builder = GenerateMeshRequestBuilder {
        face_count: Some(40_000),
        polygon_type: Some(CommonPolygonType::Triangle),
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Detailed),
        ..text_builder()
      };
      let text = expect_text(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(text.request.face_limit, Some(40_000));
      assert_eq!(text.request.quad, Some(false));
      assert_eq!(text.request.texture_quality, Some(Tripo3dH3p1TextureQuality::Detailed));
      assert_eq!(text.request.geometry_quality, Some(Tripo3dH3p1GeometryQuality::Detailed));
    }
  }

  mod option_mapping {
    use super::*;

    #[test]
    fn geometry_output_disables_texture_and_pbr() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..image_builder()
      };
      let image = expect_image(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(image.request.texture, Some(false));
      assert_eq!(image.request.pbr, Some(false));
    }

    #[test]
    fn enable_texture_false_disables_texture_and_pbr() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        ..text_builder()
      };
      let text = expect_text(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(text.request.texture, Some(false));
      assert_eq!(text.request.pbr, Some(false));
    }

    #[test]
    fn enable_texture_false_with_pbr_true_keeps_textures() {
      // PBR implies texturing, so an explicit PBR request wins.
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        enable_pbr: Some(true),
        ..image_builder()
      };
      let image = expect_image(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(image.request.texture, Some(false));
      assert_eq!(image.request.pbr, Some(true));
    }

    #[test]
    fn texture_flags_pass_through_by_default() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(true),
        enable_pbr: Some(true),
        ..image_builder()
      };
      let image = expect_image(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      assert_eq!(image.request.texture, Some(true));
      assert_eq!(image.request.pbr, Some(true));
    }

    #[test]
    fn unset_texture_flags_stay_unset() {
      let image = expect_image(build_fal_tripo3d_h3p1_state(image_builder()).expect("build"));
      assert_eq!(image.request.texture, None);
      assert_eq!(image.request.pbr, None);
    }

    #[test]
    fn polygon_type_maps_to_quad_flag() {
      let cases = [
        (Some(CommonPolygonType::Quad), Some(true)),
        (Some(CommonPolygonType::Triangle), Some(false)),
        (None, None),
      ];
      for (polygon_type, expected) in cases {
        let builder = GenerateMeshRequestBuilder {
          polygon_type,
          ..image_builder()
        };
        let image = expect_image(build_fal_tripo3d_h3p1_state(builder).expect("build"));
        assert_eq!(image.request.quad, expected, "for {polygon_type:?}");
      }
    }

    #[test]
    fn low_poly_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(matches!(
        build_fal_tripo3d_h3p1_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
      ));
    }

    #[test]
    fn low_poly_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        ..image_builder()
      };
      let image = expect_image(build_fal_tripo3d_h3p1_state(builder).expect("build"));
      // Dropped: LowPoly doesn't force the untextured flags either.
      assert_eq!(image.request.texture, None);
      assert_eq!(image.request.pbr, None);
    }

    #[test]
    fn input_mesh_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        input_mesh: Some(MeshRef::Url("https://example.com/mesh.glb".to_string())),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(matches!(
        build_fal_tripo3d_h3p1_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
      ));
    }

    #[test]
    fn input_mesh_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        input_mesh: Some(MeshRef::Url("https://example.com/mesh.glb".to_string())),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_tripo3d_h3p1_state(builder).expect("build"),
        FalTripo3dH3p1State::Image(_)
      ));
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Tripo3dH3p1,
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

  fn multiview_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      left_image: Some(ImageRef::Url(LEFT_URL.to_string())),
      ..image_builder()
    }
  }

  fn text_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      prompt: Some("a red ceramic teapot".to_string()),
      ..base_builder()
    }
  }

  fn expect_multiview(state: FalTripo3dH3p1State) -> FalTripo3dH3p1MultiviewRequestState {
    match state {
      FalTripo3dH3p1State::Multiview(multiview) => multiview,
      other => panic!("expected multiview mode, got: {other:?}"),
    }
  }

  fn expect_image(state: FalTripo3dH3p1State) -> FalTripo3dH3p1ImageRequestState {
    match state {
      FalTripo3dH3p1State::Image(image) => image,
      other => panic!("expected image mode, got: {other:?}"),
    }
  }

  fn expect_text(state: FalTripo3dH3p1State) -> FalTripo3dH3p1TextRequestState {
    match state {
      FalTripo3dH3p1State::Text(text) => text,
      other => panic!("expected text mode, got: {other:?}"),
    }
  }
}
