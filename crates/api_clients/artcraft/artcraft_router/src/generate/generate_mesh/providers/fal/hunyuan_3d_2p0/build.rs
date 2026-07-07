use fal_client::requests::api::mesh::image::hunyuan_3d_2p0_image_to_mesh::api::Hunyuan3d2p0ImageToMeshRequest;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_2p0::request::FalHunyuan3d2p0RequestState;
use crate::generate::generate_mesh::providers::fal::resolve::{
  plan_primary_image_url, plan_textured_mesh,
};
use crate::generate::generate_mesh::providers::reject_unsupported::{
  reject_unsupported_image_ref, reject_unsupported_option,
};

pub fn build_fal_hunyuan_3d_2p0(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_hunyuan_3d_2p0_state(builder)?;
  Ok(MeshGenerationDraftOrRequest::Request(MeshGenerationRequest::FalHunyuan3d2p0(state)))
}

pub(crate) fn build_fal_hunyuan_3d_2p0_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalHunyuan3d2p0RequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Hunyuan 3D 2.0 is image-to-3D only, with a single input image and no
  // extra mesh options.
  reject_unsupported_option("prompt", builder.prompt.as_ref(), strategy)?;
  reject_unsupported_option("polygon_type", builder.polygon_type.as_ref(), strategy)?;
  reject_unsupported_option("face_count", builder.face_count.as_ref(), strategy)?;
  reject_unsupported_option("enable_pbr", builder.enable_pbr.as_ref(), strategy)?;
  reject_unsupported_image_ref("back_image", builder.back_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("left_image", builder.left_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("right_image", builder.right_image.as_ref(), strategy)?;

  let image_url = plan_primary_image_url(
    builder.reference_images.take(),
    builder.front_image.take(),
    strategy,
  )?
    .ok_or_else(|| ArtcraftRouterError::InvalidInput(
      "An input image is required for Hunyuan 3D 2.0".to_string(),
    ))?;

  let request = Hunyuan3d2p0ImageToMeshRequest {
    image_url,
    textured_mesh: plan_textured_mesh(builder.mesh_output_type, strategy)?,
    // Tuning knobs stay at the endpoint's defaults.
    guidance_scale: None,
    num_inference_steps: None,
    octree_resolution: None,
    seed: None,
  };

  Ok(FalHunyuan3d2p0RequestState { request })
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

  const IMAGE_URL: &str = "https://example.com/front.png";

  mod image_requirements {
    use super::*;

    #[test]
    fn single_image_passes_through() {
      let state = build_fal_hunyuan_3d_2p0_state(base_builder()).expect("build");
      assert_eq!(state.request.image_url, IMAGE_URL);
    }

    #[test]
    fn missing_image_is_rejected() {
      let builder = GenerateMeshRequestBuilder { reference_images: None, ..base_builder() };
      assert!(matches!(
        build_fal_hunyuan_3d_2p0_state(builder),
        Err(ArtcraftRouterError::InvalidInput(_))
      ));
    }

    #[test]
    fn two_images_error_out() {
      let builder = GenerateMeshRequestBuilder {
        reference_images: Some(ImageListRef::Urls(vec![
          IMAGE_URL.to_string(),
          "https://example.com/other.png".to_string(),
        ])),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_builder()
      };
      assert!(build_fal_hunyuan_3d_2p0_state(builder).is_err());
    }

    #[test]
    fn two_images_keep_the_first_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        reference_images: Some(ImageListRef::Urls(vec![
          IMAGE_URL.to_string(),
          "https://example.com/other.png".to_string(),
        ])),
        ..base_builder()
      };
      let state = build_fal_hunyuan_3d_2p0_state(builder).expect("build");
      assert_eq!(state.request.image_url, IMAGE_URL);
    }
  }

  mod output_type_mapping {
    use super::*;

    #[test]
    fn default_maps_to_textured() {
      let state = build_fal_hunyuan_3d_2p0_state(base_builder()).expect("build");
      assert_eq!(state.request.textured_mesh, Some(true));
    }

    #[test]
    fn normal_maps_to_textured() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Normal),
        ..base_builder()
      };
      let state = build_fal_hunyuan_3d_2p0_state(builder).expect("build");
      assert_eq!(state.request.textured_mesh, Some(true));
    }

    #[test]
    fn geometry_maps_to_white_mesh() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::Geometry),
        ..base_builder()
      };
      let state = build_fal_hunyuan_3d_2p0_state(builder).expect("build");
      assert_eq!(state.request.textured_mesh, Some(false));
    }

    #[test]
    fn low_poly_errors_out_under_error_out() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_builder()
      };
      assert!(build_fal_hunyuan_3d_2p0_state(builder).is_err());
    }

    #[test]
    fn low_poly_upgrades_to_textured_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        mesh_output_type: Some(CommonMeshOutputType::LowPoly),
        ..base_builder()
      };
      let state = build_fal_hunyuan_3d_2p0_state(builder).expect("build");
      assert_eq!(state.request.textured_mesh, Some(true));
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn unsupported_options_error_out() {
      let cases: Vec<GenerateMeshRequestBuilder> = vec![
        GenerateMeshRequestBuilder { prompt: Some("a teapot".to_string()), ..base_builder() },
        GenerateMeshRequestBuilder { polygon_type: Some(CommonPolygonType::Quad), ..base_builder() },
        GenerateMeshRequestBuilder { face_count: Some(100_000), ..base_builder() },
        GenerateMeshRequestBuilder { enable_pbr: Some(true), ..base_builder() },
        GenerateMeshRequestBuilder {
          back_image: Some(ImageRef::Url("https://example.com/back.png".to_string())),
          ..base_builder()
        },
      ];
      for mut builder in cases {
        builder.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
        assert!(build_fal_hunyuan_3d_2p0_state(builder).is_err());
      }
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a teapot".to_string()),
        face_count: Some(100_000),
        enable_pbr: Some(true),
        ..base_builder()
      };
      assert!(build_fal_hunyuan_3d_2p0_state(builder).is_ok());
    }

    #[test]
    fn tuning_knobs_stay_at_endpoint_defaults() {
      let state = build_fal_hunyuan_3d_2p0_state(base_builder()).expect("build");
      assert!(state.request.guidance_scale.is_none());
      assert!(state.request.num_inference_steps.is_none());
      assert!(state.request.octree_resolution.is_none());
      assert!(state.request.seed.is_none());
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d2p0,
      provider: RouterProvider::Fal,
      reference_images: Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
      ..Default::default()
    }
  }
}
