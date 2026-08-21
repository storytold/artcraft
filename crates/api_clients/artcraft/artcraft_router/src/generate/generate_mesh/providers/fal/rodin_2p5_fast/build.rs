use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use fal_client::requests::api::mesh::image::rodin_2p5_fast_image_to_mesh::api::Rodin2p5FastImageToMeshRequest;
use fal_client::requests::api::mesh::text::rodin_2p5_fast_text_to_mesh::api::{
  Rodin2p5FastMaterial, Rodin2p5FastTextToMeshRequest,
};

use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::rodin_2p5_fast::request::{
  FalRodin2p5FastImageRequestState, FalRodin2p5FastTextRequestState,
};
use crate::generate::generate_mesh::providers::reject_unsupported::{
  reject_unsupported_image_ref, reject_unsupported_option,
};

/// The image endpoint accepts at most this many input images.
const MAX_INPUT_IMAGES: usize = 5;

/// Hyper3D Rodin v2.5 Fast combines fal's image-to-3d and text-to-3d
/// endpoints under a single router model. Any image input dispatches to
/// image-to-3d (which takes up to five views of the object, plus an optional
/// guidance prompt); otherwise a prompt dispatches to text-to-3d.
pub fn build_fal_rodin_2p5_fast(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_rodin_2p5_fast_state(builder)?;
  let request = match state {
    FalRodin2p5FastState::Image(state) => MeshGenerationRequest::FalRodin2p5FastImage(state),
    FalRodin2p5FastState::Text(state) => MeshGenerationRequest::FalRodin2p5FastText(state),
  };
  Ok(MeshGenerationDraftOrRequest::Request(request))
}

/// The endpoint selected by the request shape.
#[derive(Clone, Debug)]
pub(crate) enum FalRodin2p5FastState {
  Image(FalRodin2p5FastImageRequestState),
  Text(FalRodin2p5FastTextRequestState),
}

pub(crate) fn build_fal_rodin_2p5_fast_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalRodin2p5FastState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Options neither Rodin v2.5 Fast endpoint supports.
  reject_unsupported_option("polygon_type", builder.polygon_type.as_ref(), strategy)?;
  reject_unsupported_option("face_count", builder.face_count.as_ref(), strategy)?;
  reject_unsupported_option("texture_quality", builder.texture_quality.as_ref(), strategy)?;
  reject_unsupported_option("geometry_quality", builder.geometry_quality.as_ref(), strategy)?;
  reject_unsupported_option("input_mesh", builder.input_mesh.as_ref(), strategy)?;
  reject_unsupported_image_ref("back_image", builder.back_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("left_image", builder.left_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("right_image", builder.right_image.as_ref(), strategy)?;

  let material = plan_material(
    builder.mesh_output_type,
    builder.enable_pbr,
    builder.enable_texture,
    strategy,
  )?;
  let image_urls = plan_image_urls(
    builder.reference_images.take(),
    builder.front_image.take(),
    strategy,
  )?;

  if image_urls.is_empty() {
    // Text mode.
    let prompt = builder.prompt.take().ok_or_else(|| {
      ArtcraftRouterError::InvalidInput(
        "Rodin v2.5 Fast requires an input image or a prompt".to_string(),
      )
    })?;

    let request = Rodin2p5FastTextToMeshRequest {
      prompt,
      tier: None,
      seed: None,
      geometry_file_format: None,
      material,
      quality_mesh_option: None,
      texture_mode: None,
      enable_creative_mode: None,
      hd_texture: None,
      texture_delight: None,
      is_micro: None,
      ta_pose: None,
      bbox_condition: None,
    };
    Ok(FalRodin2p5FastState::Text(FalRodin2p5FastTextRequestState { request }))
  } else {
    // Image mode. The prompt is optional guidance here.
    let request = Rodin2p5FastImageToMeshRequest {
      image_urls,
      prompt: builder.prompt.take(),
      use_original_alpha: None,
      tier: None,
      seed: None,
      geometry_file_format: None,
      material,
      quality_mesh_option: None,
      texture_mode: None,
      enable_creative_mode: None,
      hd_texture: None,
      texture_delight: None,
      is_micro: None,
      ta_pose: None,
      bbox_condition: None,
      preview_render: None,
    };
    Ok(FalRodin2p5FastState::Image(FalRodin2p5FastImageRequestState { request }))
  }
}

// ── Option planning helpers ──

/// Collect every input image URL: all `reference_images` URLs plus the
/// `front_image` if set. More than [`MAX_INPUT_IMAGES`] rejects under
/// `ErrorOut`; the lenient strategies keep the first five. Fal only takes
/// URLs, so media file tokens are rejected.
fn plan_image_urls(
  reference_images: Option<ImageListRef>,
  front_image: Option<ImageRef>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Vec<String>, ArtcraftRouterError> {
  let mut urls: Vec<String> = Vec::new();

  match reference_images {
    None => {}
    Some(ImageListRef::Urls(reference_urls)) => urls.extend(reference_urls),
    Some(ImageListRef::MediaFileTokens(tokens)) if tokens.is_empty() => {}
    Some(ImageListRef::MediaFileTokens(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
  }

  match front_image {
    None => {}
    Some(ImageRef::Url(url)) => urls.push(url),
    Some(ImageRef::MediaFileToken(_)) => {
      return Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls));
    }
  }

  if urls.len() > MAX_INPUT_IMAGES {
    match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "reference_images",
          value: format!("Expected at most {MAX_INPUT_IMAGES} images, got {}", urls.len()),
        }));
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        urls.truncate(MAX_INPUT_IMAGES);
      }
    }
  }
  Ok(urls)
}

/// Map the builder's texturing options onto Rodin's `material` parameter.
/// PBR wins when requested; otherwise a geometry-only output type or an
/// explicit `enable_texture: false` map to no material. Rodin has no
/// low-poly mode, so `LowPoly` rejects under `ErrorOut` and is dropped
/// otherwise.
fn plan_material(
  mesh_output_type: Option<CommonMeshOutputType>,
  enable_pbr: Option<bool>,
  enable_texture: Option<bool>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Rodin2p5FastMaterial>, ArtcraftRouterError> {
  if matches!(mesh_output_type, Some(CommonMeshOutputType::LowPoly)) {
    reject_unsupported_option(
      "mesh_output_type",
      Some(&CommonMeshOutputType::LowPoly),
      strategy,
    )?;
  }
  if enable_pbr == Some(true) {
    return Ok(Some(Rodin2p5FastMaterial::Pbr));
  }
  let skip_texturing = matches!(mesh_output_type, Some(CommonMeshOutputType::Geometry))
    || enable_texture == Some(false);
  if skip_texturing {
    return Ok(Some(Rodin2p5FastMaterial::NoMaterial));
  }
  Ok(None)
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_quality::CommonMeshQuality;
  use enums::common::generation::common_polygon_type::CommonPolygonType;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::mesh_ref::MeshRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;

  use super::*;

  const FRONT_URL: &str = "https://example.com/front.png";
  const SECOND_URL: &str = "https://example.com/second.png";
  const PROMPT: &str = "a red ceramic teapot";

  mod shape_dispatch {
    use super::*;

    #[test]
    fn reference_image_dispatches_to_image_mode() {
      let state = build_fal_rodin_2p5_fast_state(image_builder()).expect("build");
      let image = expect_image(state);
      assert_eq!(image.request.image_urls, vec![FRONT_URL.to_string()]);
    }

    #[test]
    fn front_image_dispatches_to_image_mode() {
      let builder = GenerateMeshRequestBuilder {
        reference_images: None,
        front_image: Some(ImageRef::Url(FRONT_URL.to_string())),
        ..base_builder()
      };
      let image = expect_image(build_fal_rodin_2p5_fast_state(builder).expect("build"));
      assert_eq!(image.request.image_urls, vec![FRONT_URL.to_string()]);
    }

    #[test]
    fn prompt_only_dispatches_to_text_mode() {
      let state = build_fal_rodin_2p5_fast_state(text_builder()).expect("build");
      let text = expect_text(state);
      assert_eq!(text.request.prompt, PROMPT);
    }

    #[test]
    fn neither_image_nor_prompt_is_rejected() {
      let result = build_fal_rodin_2p5_fast_state(base_builder());
      assert!(matches!(result, Err(ArtcraftRouterError::InvalidInput(_))));
    }
  }

  mod image_mode {
    use super::*;

    #[test]
    fn multiple_reference_urls_collect_into_image_urls() {
      let builder = GenerateMeshRequestBuilder {
        reference_images: Some(ImageListRef::Urls(vec![
          FRONT_URL.to_string(),
          SECOND_URL.to_string(),
        ])),
        front_image: Some(ImageRef::Url("https://example.com/third.png".to_string())),
        ..base_builder()
      };
      let image = expect_image(build_fal_rodin_2p5_fast_state(builder).expect("build"));
      assert_eq!(image.request.image_urls, vec![
        FRONT_URL.to_string(),
        SECOND_URL.to_string(),
        "https://example.com/third.png".to_string(),
      ]);
    }

    #[test]
    fn more_than_five_images_error_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        reference_images: Some(ImageListRef::Urls(six_urls())),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_builder()
      };
      assert!(matches!(
        build_fal_rodin_2p5_fast_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
      ));
    }

    #[test]
    fn more_than_five_images_truncate_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        reference_images: Some(ImageListRef::Urls(six_urls())),
        ..base_builder()
      };
      let image = expect_image(build_fal_rodin_2p5_fast_state(builder).expect("build"));
      assert_eq!(image.request.image_urls.len(), 5);
      assert_eq!(image.request.image_urls, &six_urls()[..5]);
    }

    #[test]
    fn prompt_is_forwarded_as_guidance() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some(PROMPT.to_string()),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      let image = expect_image(build_fal_rodin_2p5_fast_state(builder).expect("build"));
      assert_eq!(image.request.prompt.as_deref(), Some(PROMPT));
    }

    #[test]
    fn reference_media_tokens_are_rejected() {
      let builder = GenerateMeshRequestBuilder {
        reference_images: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_test123".to_string()),
        ])),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_rodin_2p5_fast_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }

    #[test]
    fn front_image_media_token_is_rejected() {
      let builder = GenerateMeshRequestBuilder {
        front_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_front".to_string()))),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_rodin_2p5_fast_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }
  }

  mod material_mapping {
    use super::*;

    #[test]
    fn pbr_maps_to_pbr_material() {
      let builder = GenerateMeshRequestBuilder {
        enable_pbr: Some(true),
        ..image_builder()
      };
      let image = expect_image(build_fal_rodin_2p5_fast_state(builder).expect("build"));
      assert_eq!(image.request.material, Some(Rodin2p5FastMaterial::Pbr));
    }

    #[test]
    fn geometry_maps_to_no_material() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..image_builder()
      };
      let image = expect_image(build_fal_rodin_2p5_fast_state(builder).expect("build"));
      assert_eq!(image.request.material, Some(Rodin2p5FastMaterial::NoMaterial));
    }

    #[test]
    fn enable_texture_false_maps_to_no_material() {
      let builder = GenerateMeshRequestBuilder {
        enable_texture: Some(false),
        ..text_builder()
      };
      let text = expect_text(build_fal_rodin_2p5_fast_state(builder).expect("build"));
      assert_eq!(text.request.material, Some(Rodin2p5FastMaterial::NoMaterial));
    }

    #[test]
    fn pbr_takes_precedence_over_geometry() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        enable_pbr: Some(true),
        ..image_builder()
      };
      let image = expect_image(build_fal_rodin_2p5_fast_state(builder).expect("build"));
      assert_eq!(image.request.material, Some(Rodin2p5FastMaterial::Pbr));
    }

    #[test]
    fn material_is_unset_by_default() {
      let image = expect_image(build_fal_rodin_2p5_fast_state(image_builder()).expect("build"));
      assert_eq!(image.request.material, None);
    }

    #[test]
    fn low_poly_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..image_builder()
      };
      assert!(build_fal_rodin_2p5_fast_state(builder).is_err());
    }

    #[test]
    fn low_poly_is_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        ..image_builder()
      };
      let image = expect_image(build_fal_rodin_2p5_fast_state(builder).expect("build"));
      assert_eq!(image.request.material, None);
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn unsupported_options_error_out_under_error_out() {
      let cases: Vec<(&str, GenerateMeshRequestBuilder)> = vec![
        ("polygon_type", GenerateMeshRequestBuilder {
          polygon_type: Some(CommonPolygonType::Quad),
          ..error_out_image_builder()
        }),
        ("face_count", GenerateMeshRequestBuilder {
          face_count: Some(100_000),
          ..error_out_image_builder()
        }),
        ("texture_quality", GenerateMeshRequestBuilder {
          texture_quality: Some(CommonMeshQuality::Detailed),
          ..error_out_image_builder()
        }),
        ("geometry_quality", GenerateMeshRequestBuilder {
          geometry_quality: Some(CommonMeshQuality::Detailed),
          ..error_out_image_builder()
        }),
        ("input_mesh", GenerateMeshRequestBuilder {
          input_mesh: Some(MeshRef::Url("https://example.com/mesh.glb".to_string())),
          ..error_out_image_builder()
        }),
        ("back_image", GenerateMeshRequestBuilder {
          back_image: Some(ImageRef::Url("https://example.com/back.png".to_string())),
          ..error_out_image_builder()
        }),
        ("left_image", GenerateMeshRequestBuilder {
          left_image: Some(ImageRef::Url("https://example.com/left.png".to_string())),
          ..error_out_image_builder()
        }),
        ("right_image", GenerateMeshRequestBuilder {
          right_image: Some(ImageRef::Url("https://example.com/right.png".to_string())),
          ..error_out_image_builder()
        }),
      ];
      for (field, builder) in cases {
        assert!(
          build_fal_rodin_2p5_fast_state(builder).is_err(),
          "expected error for {field}",
        );
      }
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Quad),
        face_count: Some(100_000),
        texture_quality: Some(CommonMeshQuality::Detailed),
        geometry_quality: Some(CommonMeshQuality::Standard),
        input_mesh: Some(MeshRef::Url("https://example.com/mesh.glb".to_string())),
        back_image: Some(ImageRef::Url("https://example.com/back.png".to_string())),
        ..image_builder()
      };
      assert!(matches!(
        build_fal_rodin_2p5_fast_state(builder).expect("build"),
        FalRodin2p5FastState::Image(_)
      ));
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Rodin2p5Fast,
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

  fn error_out_image_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..image_builder()
    }
  }

  fn text_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      prompt: Some(PROMPT.to_string()),
      ..base_builder()
    }
  }

  fn six_urls() -> Vec<String> {
    (1..=6).map(|i| format!("https://example.com/view-{i}.png")).collect()
  }

  fn expect_image(state: FalRodin2p5FastState) -> FalRodin2p5FastImageRequestState {
    match state {
      FalRodin2p5FastState::Image(image) => image,
      FalRodin2p5FastState::Text(text) => panic!("expected image mode, got text: {text:?}"),
    }
  }

  fn expect_text(state: FalRodin2p5FastState) -> FalRodin2p5FastTextRequestState {
    match state {
      FalRodin2p5FastState::Text(text) => text,
      FalRodin2p5FastState::Image(image) => panic!("expected text mode, got image: {image:?}"),
    }
  }
}
