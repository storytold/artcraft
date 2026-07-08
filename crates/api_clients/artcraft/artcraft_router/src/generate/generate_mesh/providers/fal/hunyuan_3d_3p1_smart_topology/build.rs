use enums::common::generation::common_polygon_type::CommonPolygonType;
use fal_client::requests::api::mesh::topology::hunyuan_3d_3p1_smart_topology::api::{
  Hunyuan3d3p1SmartTopologyInputFileType, Hunyuan3d3p1SmartTopologyPolygonType,
  Hunyuan3d3p1SmartTopologyRequest,
};

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::fal::hunyuan_3d_3p1_smart_topology::request::FalHunyuan3d3p1SmartTopologyRequestState;
use crate::generate::generate_mesh::providers::fal::resolve::plan_input_mesh_url;
use crate::generate::generate_mesh::providers::reject_unsupported::{
  reject_unsupported_image_ref, reject_unsupported_option,
};

/// Hunyuan 3D v3.1 Smart Topology retopologizes an existing mesh. It takes a
/// mesh file (GLB or OBJ) and an optional polygon type — text, images, and
/// the other generation options are all unsupported.
pub fn build_fal_hunyuan_3d_3p1_smart_topology(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let state = build_fal_hunyuan_3d_3p1_smart_topology_state(builder)?;
  Ok(MeshGenerationDraftOrRequest::Request(MeshGenerationRequest::FalHunyuan3d3p1SmartTopology(state)))
}

pub(crate) fn build_fal_hunyuan_3d_3p1_smart_topology_state(
  mut builder: GenerateMeshRequestBuilder,
) -> Result<FalHunyuan3d3p1SmartTopologyRequestState, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let input_file_url = plan_input_mesh_url(builder.input_mesh.take())?.ok_or_else(|| {
    ArtcraftRouterError::InvalidInput(
      "Hunyuan 3D v3.1 Smart Topology requires an input mesh file (GLB or OBJ)".to_string(),
    )
  })?;

  // Retopology takes only the mesh file and a polygon type; every other
  // option is unsupported.
  reject_unsupported_option("prompt", builder.prompt.as_ref(), strategy)?;
  reject_unsupported_option("reference_images", builder.reference_images.as_ref(), strategy)?;
  reject_unsupported_image_ref("front_image", builder.front_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("back_image", builder.back_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("left_image", builder.left_image.as_ref(), strategy)?;
  reject_unsupported_image_ref("right_image", builder.right_image.as_ref(), strategy)?;
  reject_unsupported_option("mesh_output_type", builder.mesh_output_type.as_ref(), strategy)?;
  reject_unsupported_option("face_count", builder.face_count.as_ref(), strategy)?;
  reject_unsupported_option("enable_pbr", builder.enable_pbr.as_ref(), strategy)?;
  reject_unsupported_option("enable_texture", builder.enable_texture.as_ref(), strategy)?;
  reject_unsupported_option("texture_quality", builder.texture_quality.as_ref(), strategy)?;
  reject_unsupported_option("geometry_quality", builder.geometry_quality.as_ref(), strategy)?;

  let input_file_type = infer_input_file_type(&input_file_url);
  let request = Hunyuan3d3p1SmartTopologyRequest {
    input_file_url,
    input_file_type,
    polygon_type: builder.polygon_type.map(to_polygon_type),
    face_level: None,
  };
  Ok(FalHunyuan3d3p1SmartTopologyRequestState { request })
}

// ── Mapping helpers ──

/// Infer the input file format from the URL path: a path ending in `.obj`
/// (case-insensitive, ignoring any query string) maps to `Obj`; anything
/// else is left unset (fal defaults to GLB).
fn infer_input_file_type(url: &str) -> Option<Hunyuan3d3p1SmartTopologyInputFileType> {
  let path = url.split(['?', '#']).next().unwrap_or(url);
  if path.to_ascii_lowercase().ends_with(".obj") {
    Some(Hunyuan3d3p1SmartTopologyInputFileType::Obj)
  } else {
    None
  }
}

fn to_polygon_type(polygon_type: CommonPolygonType) -> Hunyuan3d3p1SmartTopologyPolygonType {
  match polygon_type {
    CommonPolygonType::Triangle => Hunyuan3d3p1SmartTopologyPolygonType::Triangle,
    CommonPolygonType::Quad => Hunyuan3d3p1SmartTopologyPolygonType::Quadrilateral,
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_ref::ImageRef;
  use crate::api::mesh_ref::MeshRef;
  use crate::api::router_mesh_model::RouterMeshModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::errors::client_error::ClientError;

  use super::*;

  const GLB_URL: &str = "https://example.com/model.glb";
  const OBJ_URL: &str = "https://example.com/model.obj";

  mod shape_dispatch {
    use super::*;

    #[test]
    fn input_mesh_url_builds_the_request() {
      let state = build_fal_hunyuan_3d_3p1_smart_topology_state(mesh_builder(GLB_URL))
        .expect("build");
      assert_eq!(state.request.input_file_url, GLB_URL);
      assert!(state.request.face_level.is_none());
    }

    #[test]
    fn missing_input_mesh_is_rejected() {
      let result = build_fal_hunyuan_3d_3p1_smart_topology_state(base_builder());
      assert!(matches!(result, Err(ArtcraftRouterError::InvalidInput(_))));
    }

    #[test]
    fn media_token_input_mesh_is_rejected() {
      let builder = GenerateMeshRequestBuilder {
        input_mesh: Some(MeshRef::MediaFileToken(MediaFileToken::new("mf_mesh".to_string()))),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_hunyuan_3d_3p1_smart_topology_state(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }
  }

  mod option_mapping {
    use super::*;

    #[test]
    fn obj_url_infers_obj_input_file_type() {
      let state = build_fal_hunyuan_3d_3p1_smart_topology_state(mesh_builder(OBJ_URL))
        .expect("build");
      assert!(matches!(
        state.request.input_file_type,
        Some(Hunyuan3d3p1SmartTopologyInputFileType::Obj)
      ));
    }

    #[test]
    fn obj_inference_is_case_insensitive_and_ignores_the_query_string() {
      let cases = [
        "https://example.com/model.OBJ",
        "https://example.com/model.obj?token=abc123",
        "https://example.com/model.Obj#fragment",
      ];
      for url in cases {
        assert!(
          matches!(infer_input_file_type(url), Some(Hunyuan3d3p1SmartTopologyInputFileType::Obj)),
          "for {url}",
        );
      }
    }

    #[test]
    fn non_obj_urls_leave_input_file_type_unset() {
      let cases = [
        GLB_URL,
        "https://example.com/model.fbx",
        "https://example.com/model.glb?format=obj",
      ];
      for url in cases {
        assert!(infer_input_file_type(url).is_none(), "for {url}");
      }
    }

    #[test]
    fn polygon_type_maps_through() {
      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Quad),
        ..mesh_builder(GLB_URL)
      };
      let state = build_fal_hunyuan_3d_3p1_smart_topology_state(builder).expect("build");
      assert!(matches!(
        state.request.polygon_type,
        Some(Hunyuan3d3p1SmartTopologyPolygonType::Quadrilateral)
      ));

      let builder = GenerateMeshRequestBuilder {
        polygon_type: Some(CommonPolygonType::Triangle),
        ..mesh_builder(GLB_URL)
      };
      let state = build_fal_hunyuan_3d_3p1_smart_topology_state(builder).expect("build");
      assert!(matches!(
        state.request.polygon_type,
        Some(Hunyuan3d3p1SmartTopologyPolygonType::Triangle)
      ));
    }
  }

  mod unsupported_options {
    use super::*;

    #[test]
    fn each_unsupported_option_errors_out_under_error_out() {
      let cases: Vec<fn(&mut GenerateMeshRequestBuilder)> = vec![
        |b| b.prompt = Some("a red ceramic teapot".to_string()),
        |b| b.front_image = Some(ImageRef::Url("https://example.com/front.png".to_string())),
        |b| b.back_image = Some(ImageRef::Url("https://example.com/back.png".to_string())),
        |b| b.mesh_output_type = Some(CommonMeshOutputType::Normal),
        |b| b.face_count = Some(100_000),
        |b| b.enable_pbr = Some(true),
        |b| b.enable_texture = Some(false),
      ];
      for (index, set) in cases.into_iter().enumerate() {
        let mut builder = GenerateMeshRequestBuilder {
          request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
          ..mesh_builder(GLB_URL)
        };
        set(&mut builder);
        assert!(build_fal_hunyuan_3d_3p1_smart_topology_state(builder).is_err(), "for case {index}");
      }
    }

    #[test]
    fn unsupported_options_are_dropped_under_lenient_strategies() {
      let builder = GenerateMeshRequestBuilder {
        prompt: Some("a red ceramic teapot".to_string()),
        mesh_output_type: Some(CommonMeshOutputType::Normal),
        face_count: Some(100_000),
        enable_pbr: Some(true),
        ..mesh_builder(GLB_URL)
      };
      let state = build_fal_hunyuan_3d_3p1_smart_topology_state(builder).expect("build");
      assert_eq!(state.request.input_file_url, GLB_URL);
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      model: RouterMeshModel::Hunyuan3d3p1SmartTopology,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  fn mesh_builder(url: &str) -> GenerateMeshRequestBuilder {
    GenerateMeshRequestBuilder {
      input_mesh: Some(MeshRef::Url(url.to_string())),
      ..base_builder()
    }
  }
}
