use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_mesh_cost_and_generate_request::OmniGenMeshCostAndGenerateRequest;
use enums::common::generation::common_mesh_model::CommonMeshModel as CommonMeshModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::providers::artcraft::resolve::{
  resolve_image_list_ref, resolve_image_ref, resolve_mesh_ref,
};

/// Build an `OmniGenMeshCostAndGenerateRequest` from the builder. The
/// Artcraft provider is a thin forwarding shim: the storyteller-web omni
/// mesh endpoint owns per-model validation and option mapping, so the
/// builder's options are passed through as-is.
pub fn build_artcraft_omni_mesh_request(
  mut builder: GenerateMeshRequestBuilder,
  model: CommonMeshModelEnum,
) -> Result<OmniGenMeshCostAndGenerateRequest, ArtcraftRouterError> {
  let reference_image_media_tokens = resolve_image_list_ref(builder.reference_images.take())?;
  let front_image_media_token = resolve_image_ref(builder.front_image.take())?;
  let back_image_media_token = resolve_image_ref(builder.back_image.take())?;
  let left_image_media_token = resolve_image_ref(builder.left_image.take())?;
  let right_image_media_token = resolve_image_ref(builder.right_image.take())?;
  let input_mesh_media_token = resolve_mesh_ref(builder.input_mesh.take())?;
  let idempotency_token = builder.get_or_generate_idempotency_token();

  Ok(OmniGenMeshCostAndGenerateRequest {
    idempotency_token: Some(idempotency_token),
    model: Some(model),
    prompt: builder.prompt.take(),
    reference_image_media_tokens,
    front_image_media_token,
    back_image_media_token,
    left_image_media_token,
    right_image_media_token,
    input_mesh_media_token,
    mesh_output_type: builder.mesh_output_type,
    polygon_type: builder.polygon_type,
    face_count: builder.face_count,
    enable_pbr: builder.enable_pbr,
    enable_texture: builder.enable_texture,
    texture_quality: builder.texture_quality,
    geometry_quality: builder.geometry_quality,
  })
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
  use enums::common::generation::common_polygon_type::CommonPolygonType;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::errors::client_error::ClientError;

  use super::*;

  #[test]
  fn all_fields_are_forwarded() {
    let builder = GenerateMeshRequestBuilder {
      prompt: Some("a red ceramic teapot".to_string()),
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_ref".to_string()),
      ])),
      front_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_front".to_string()))),
      back_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_back".to_string()))),
      left_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_left".to_string()))),
      right_image: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_right".to_string()))),
      mesh_output_type: Some(CommonMeshOutputType::LowPoly),
      polygon_type: Some(CommonPolygonType::Quad),
      face_count: Some(100_000),
      enable_pbr: Some(true),
      idempotency_token: Some("test-token".to_string()),
      ..base_builder()
    };

    let request = build_artcraft_omni_mesh_request(builder, CommonMeshModelEnum::Hunyuan3d3)
      .expect("build");

    assert_eq!(request.idempotency_token.as_deref(), Some("test-token"));
    assert_eq!(request.model, Some(CommonMeshModelEnum::Hunyuan3d3));
    assert_eq!(request.prompt.as_deref(), Some("a red ceramic teapot"));
    assert_eq!(request.reference_image_media_tokens.as_ref().map(|t| t.len()), Some(1));
    assert_eq!(request.front_image_media_token.as_ref().map(|t| t.as_str()), Some("mf_front"));
    assert_eq!(request.back_image_media_token.as_ref().map(|t| t.as_str()), Some("mf_back"));
    assert_eq!(request.left_image_media_token.as_ref().map(|t| t.as_str()), Some("mf_left"));
    assert_eq!(request.right_image_media_token.as_ref().map(|t| t.as_str()), Some("mf_right"));
    assert_eq!(request.mesh_output_type, Some(CommonMeshOutputType::LowPoly));
    assert_eq!(request.polygon_type, Some(CommonPolygonType::Quad));
    assert_eq!(request.face_count, Some(100_000));
    assert_eq!(request.enable_pbr, Some(true));
  }

  #[test]
  fn idempotency_token_is_generated_when_missing() {
    let request = build_artcraft_omni_mesh_request(base_builder(), CommonMeshModelEnum::Hunyuan3d3)
      .expect("build");
    assert!(request.idempotency_token.is_some());
    assert!(!request.idempotency_token.unwrap().is_empty());
  }

  #[test]
  fn reference_image_url_references_are_rejected() {
    let builder = GenerateMeshRequestBuilder {
      reference_images: Some(ImageListRef::Urls(vec!["https://example.com/a.png".to_string()])),
      ..base_builder()
    };
    let result = build_artcraft_omni_mesh_request(builder, CommonMeshModelEnum::Hunyuan3d3);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }

  #[test]
  fn side_image_url_references_are_rejected() {
    let builder = GenerateMeshRequestBuilder {
      back_image: Some(ImageRef::Url("https://example.com/back.png".to_string())),
      ..base_builder()
    };
    let result = build_artcraft_omni_mesh_request(builder, CommonMeshModelEnum::Hunyuan3d3);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3,
      provider: RouterProvider::Artcraft,
      prompt: Some("a red ceramic teapot".to_string()),
      ..Default::default()
    }
  }
}
