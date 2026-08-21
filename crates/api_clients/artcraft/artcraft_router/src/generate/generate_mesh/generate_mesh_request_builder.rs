use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use enums::common::generation::common_mesh_quality::CommonMeshQuality;
use enums::common::generation::common_polygon_type::CommonPolygonType;

use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::mesh_ref::MeshRef;
use crate::api::router_mesh_model::RouterMeshModel;
use crate::api::router_provider::RouterProvider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::providers::artcraft::hunyuan3d_3::build::build_artcraft_hunyuan3d_3;
use crate::generate::generate_mesh::providers::artcraft::hunyuan3d_3_sketch::build::build_artcraft_hunyuan3d_3_sketch;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_2p0::build::build_artcraft_hunyuan_3d_2p0;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_2p1::build::build_artcraft_hunyuan_3d_2p1;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_part::build::build_artcraft_hunyuan_3d_3p1_part;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_pro::build::build_artcraft_hunyuan_3d_3p1_pro;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_rapid::build::build_artcraft_hunyuan_3d_3p1_rapid;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_3p1_smart_topology::build::build_artcraft_hunyuan_3d_3p1_smart_topology;
use crate::generate::generate_mesh::providers::artcraft::meshy_v6::build::build_artcraft_meshy_v6;
use crate::generate::generate_mesh::providers::artcraft::rodin_2p5_fast::build::build_artcraft_rodin_2p5_fast;
use crate::generate::generate_mesh::providers::artcraft::tripo3d_h3p1::build::build_artcraft_tripo3d_h3p1;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3::build::build_fal_hunyuan3d_3;
use crate::generate::generate_mesh::providers::fal::hunyuan3d_3_sketch::build::build_fal_hunyuan3d_3_sketch;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_2p0::build::build_fal_hunyuan_3d_2p0;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_2p1::build::build_fal_hunyuan_3d_2p1;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_part::build::build_fal_hunyuan_3d_3p1_part;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_pro::build::build_fal_hunyuan_3d_3p1_pro;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_rapid::build::build_fal_hunyuan_3d_3p1_rapid;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_smart_topology::build::build_fal_hunyuan_3d_3p1_smart_topology;
use crate::generate::generate_mesh::providers::fal::meshy_v6::build::build_fal_meshy_v6;
use crate::generate::generate_mesh::providers::fal::rodin_2p5_fast::build::build_fal_rodin_2p5_fast;
use crate::generate::generate_mesh::providers::fal::tripo3d_h3p1::build::build_fal_tripo3d_h3p1;

/// RouterProvider-agnostic mesh (3D object) generation request. Distilled by
/// `build2()` into a `MeshGenerationDraftOrRequest` for the selected
/// (provider, model) pair.
#[derive(Clone, Debug)]
pub struct GenerateMeshRequestBuilder {
  /// Which model to use.
  pub model: RouterMeshModel,

  /// Which provider to use.
  pub provider: RouterProvider,

  /// The text prompt (text-to-3D, or the sketch description for sketch-to-3D).
  pub prompt: Option<String>,

  /// Reference images (optional).
  /// The primary/front input image, or the sketch image for sketch-to-3D.
  pub reference_images: Option<ImageListRef>,

  /// Front view image (optional; multi-view input).
  /// Can be used instead of `reference_images[0]` when the other side views
  /// are supplied.
  pub front_image: Option<ImageRef>,

  /// Back view image (optional; multi-view input).
  pub back_image: Option<ImageRef>,

  /// Left view image (optional; multi-view input).
  pub left_image: Option<ImageRef>,

  /// Right view image (optional; multi-view input).
  pub right_image: Option<ImageRef>,

  /// Input mesh file for mesh-to-mesh models (part splitting, retopology).
  pub input_mesh: Option<MeshRef>,

  /// The mesh output type to generate (normal, low-poly, or geometry-only).
  pub mesh_output_type: Option<CommonMeshOutputType>,

  /// The polygon type to use for the generated mesh (triangle or quad).
  pub polygon_type: Option<CommonPolygonType>,

  /// Target face count for the generated mesh.
  pub face_count: Option<u64>,

  /// Whether to generate PBR (physically based rendering) materials.
  pub enable_pbr: Option<bool>,

  /// Whether to generate textures. Some models (Tripo3D) can skip texturing
  /// for a cheaper, faster generation.
  pub enable_texture: Option<bool>,

  /// Texture quality. `Detailed` may cost extra (e.g. Tripo3D's HD tier).
  pub texture_quality: Option<CommonMeshQuality>,

  /// Geometry quality. `Detailed` may cost extra (e.g. Tripo3D).
  pub geometry_quality: Option<CommonMeshQuality>,

  /// If the request is a mismatch with the (model/provider), how to mitigate it.
  pub request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy,

  /// Some providers support idempotency.
  /// If not supplied, we'll generate one for the required providers.
  pub idempotency_token: Option<String>,
}

impl Default for GenerateMeshRequestBuilder {
  fn default() -> Self {
    Self {
      model: RouterMeshModel::Hunyuan3d3,
      provider: RouterProvider::Artcraft,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      prompt: None,
      reference_images: None,
      front_image: None,
      back_image: None,
      left_image: None,
      right_image: None,
      input_mesh: None,
      mesh_output_type: None,
      polygon_type: None,
      face_count: None,
      enable_pbr: None,
      enable_texture: None,
      texture_quality: None,
      geometry_quality: None,
      idempotency_token: None,
    }
  }
}

impl GenerateMeshRequestBuilder {

  pub fn build2(self) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
    match (self.provider, self.model) {
      // Artcraft
      (RouterProvider::Artcraft, RouterMeshModel::Hunyuan3d2p0) => build_artcraft_hunyuan_3d_2p0(self),
      (RouterProvider::Artcraft, RouterMeshModel::Hunyuan3d2p1) => build_artcraft_hunyuan_3d_2p1(self),
      (RouterProvider::Artcraft, RouterMeshModel::Hunyuan3d3) => build_artcraft_hunyuan3d_3(self),
      (RouterProvider::Artcraft, RouterMeshModel::Hunyuan3d3Sketch) => build_artcraft_hunyuan3d_3_sketch(self),
      (RouterProvider::Artcraft, RouterMeshModel::Hunyuan3d3p1Pro) => build_artcraft_hunyuan_3d_3p1_pro(self),
      (RouterProvider::Artcraft, RouterMeshModel::Hunyuan3d3p1Rapid) => build_artcraft_hunyuan_3d_3p1_rapid(self),
      (RouterProvider::Artcraft, RouterMeshModel::Hunyuan3d3p1Part) => build_artcraft_hunyuan_3d_3p1_part(self),
      (RouterProvider::Artcraft, RouterMeshModel::Hunyuan3d3p1SmartTopology) => build_artcraft_hunyuan_3d_3p1_smart_topology(self),
      (RouterProvider::Artcraft, RouterMeshModel::Tripo3dH3p1) => build_artcraft_tripo3d_h3p1(self),
      (RouterProvider::Artcraft, RouterMeshModel::MeshyV6) => build_artcraft_meshy_v6(self),
      (RouterProvider::Artcraft, RouterMeshModel::Rodin2p5Fast) => build_artcraft_rodin_2p5_fast(self),
      // Fal
      (RouterProvider::Fal, RouterMeshModel::Hunyuan3d2p0) => build_fal_hunyuan_3d_2p0(self),
      (RouterProvider::Fal, RouterMeshModel::Hunyuan3d2p1) => build_fal_hunyuan_3d_2p1(self),
      (RouterProvider::Fal, RouterMeshModel::Hunyuan3d3) => build_fal_hunyuan3d_3(self),
      (RouterProvider::Fal, RouterMeshModel::Hunyuan3d3Sketch) => build_fal_hunyuan3d_3_sketch(self),
      (RouterProvider::Fal, RouterMeshModel::Hunyuan3d3p1Pro) => build_fal_hunyuan_3d_3p1_pro(self),
      (RouterProvider::Fal, RouterMeshModel::Hunyuan3d3p1Rapid) => build_fal_hunyuan_3d_3p1_rapid(self),
      (RouterProvider::Fal, RouterMeshModel::Hunyuan3d3p1Part) => build_fal_hunyuan_3d_3p1_part(self),
      (RouterProvider::Fal, RouterMeshModel::Hunyuan3d3p1SmartTopology) => build_fal_hunyuan_3d_3p1_smart_topology(self),
      (RouterProvider::Fal, RouterMeshModel::Tripo3dH3p1) => build_fal_tripo3d_h3p1(self),
      (RouterProvider::Fal, RouterMeshModel::MeshyV6) => build_fal_meshy_v6(self),
      (RouterProvider::Fal, RouterMeshModel::Rodin2p5Fast) => build_fal_rodin_2p5_fast(self),
      _ => self.unsupported_provider_and_model(),
    }
  }

  pub fn get_or_generate_idempotency_token(&self) -> String {
    self.idempotency_token.clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
  }

  fn unsupported_provider_and_model(&self) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
    Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(
      format!("Mesh generation for model `{:?}` is not supported for provider {:?}", self.model, self.provider)
    ))
  }
}

#[cfg(test)]
mod tests {
  use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;

  use super::*;

  const IMAGE_URL: &str = "https://example.com/front.png";

  mod dispatch_tests {
    use super::*;

    #[test]
    fn artcraft_models_dispatch() {
      let cases = [
        RouterMeshModel::Hunyuan3d2p0,
        RouterMeshModel::Hunyuan3d2p1,
        RouterMeshModel::Hunyuan3d3,
        RouterMeshModel::Hunyuan3d3Sketch,
      ];
      for model in cases {
        let result = builder_with_token_image(RouterProvider::Artcraft, model).build2()
          .unwrap_or_else(|e| panic!("build should succeed for {model:?}: {e}"));
        let request = expect_request(result);
        let matches = matches!(
          (model, &request),
          (RouterMeshModel::Hunyuan3d2p0, MeshGenerationRequest::ArtcraftHunyuan3d2p0(_))
            | (RouterMeshModel::Hunyuan3d2p1, MeshGenerationRequest::ArtcraftHunyuan3d2p1(_))
            | (RouterMeshModel::Hunyuan3d3, MeshGenerationRequest::ArtcraftHunyuan3d3(_))
            | (RouterMeshModel::Hunyuan3d3Sketch, MeshGenerationRequest::ArtcraftHunyuan3d3Sketch(_))
        );
        assert!(matches, "unexpected dispatch for {model:?}: {request:?}");
      }
    }

    #[test]
    fn fal_hunyuan3d_3_with_image_dispatches_to_image_endpoint() {
      let result = builder_with_url_image(RouterProvider::Fal, RouterMeshModel::Hunyuan3d3)
        .build2().expect("build");
      assert!(matches!(
        expect_request(result),
        MeshGenerationRequest::FalHunyuan3d3Image(_)
      ));
    }

    #[test]
    fn fal_hunyuan3d_3_with_prompt_only_dispatches_to_text_endpoint() {
      let builder = GenerateMeshRequestBuilder {
        provider: RouterProvider::Fal,
        model: RouterMeshModel::Hunyuan3d3,
        prompt: Some("a red ceramic teapot".to_string()),
        ..Default::default()
      };
      let result = builder.build2().expect("build");
      assert!(matches!(
        expect_request(result),
        MeshGenerationRequest::FalHunyuan3d3Text(_)
      ));
    }

    #[test]
    fn fal_hunyuan3d_3_sketch_dispatches() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        ..builder_with_url_image(RouterProvider::Fal, RouterMeshModel::Hunyuan3d3Sketch)
      };
      let result = builder.build2().expect("build");
      assert!(matches!(
        expect_request(result),
        MeshGenerationRequest::FalHunyuan3d3Sketch(_)
      ));
    }

    #[test]
    fn fal_hunyuan_3d_2p0_dispatches() {
      let result = builder_with_url_image(RouterProvider::Fal, RouterMeshModel::Hunyuan3d2p0)
        .build2().expect("build");
      assert!(matches!(
        expect_request(result),
        MeshGenerationRequest::FalHunyuan3d2p0(_)
      ));
    }

    #[test]
    fn fal_hunyuan_3d_2p1_dispatches() {
      let result = builder_with_url_image(RouterProvider::Fal, RouterMeshModel::Hunyuan3d2p1)
        .build2().expect("build");
      assert!(matches!(
        expect_request(result),
        MeshGenerationRequest::FalHunyuan3d2p1(_)
      ));
    }
  }

  mod unsupported_combo_tests {
    use super::*;

    #[test]
    fn non_mesh_providers_are_unsupported() {
      for provider in [
        RouterProvider::GmiCloud,
        RouterProvider::GrokApi,
        RouterProvider::KinoviWeb,
        RouterProvider::WorldLabs,
      ] {
        let result = builder_with_url_image(provider, RouterMeshModel::Hunyuan3d3).build2();
        assert!(
          matches!(result, Err(ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(_))),
          "expected unsupported error for {provider:?}",
        );
      }
    }
  }

  // ── Helpers ──

  fn builder_with_url_image(provider: RouterProvider, model: RouterMeshModel) -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      provider,
      model,
      reference_images: Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
      ..Default::default()
    }
  }

  fn builder_with_token_image(provider: RouterProvider, model: RouterMeshModel) -> GenerateMeshRequestBuilder {
    use tokens::tokens::media_files::MediaFileToken;
    GenerateMeshRequestBuilder {
      provider,
      model,
      prompt: Some("a red ceramic teapot".to_string()),
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_test123".to_string()),
      ])),
      ..Default::default()
    }
  }

  fn expect_request(result: MeshGenerationDraftOrRequest) -> MeshGenerationRequest {
    match result {
      MeshGenerationDraftOrRequest::Request(request) => request,
      MeshGenerationDraftOrRequest::Draft(draft) => panic!("expected Request, got Draft: {draft:?}"),
    }
  }
}
