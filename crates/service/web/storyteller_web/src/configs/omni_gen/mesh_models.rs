use artcraft_api_defs::omni_gen::models::omni_gen_mesh_models::{
  OmniGenMeshModelDetails,
  OmniGenMeshModelProviderDetails,
  OmniGenMeshModelsResponse,
  OmniGenMeshProviderModelDetails,
};
use enums::common::generation::common_mesh_model::CommonMeshModel;
use enums::common::generation::common_mesh_output_type::CommonMeshOutputType;
use enums::common::generation::common_polygon_type::CommonPolygonType;
use enums::common::generation::model_creator::ModelCreator;
use enums::common::generation_provider::GenerationProvider;
use once_cell::sync::Lazy;

pub static OMNI_GEN_MESH_MODELS_AND_PROVIDERS: Lazy<OmniGenMeshModelsResponse> = Lazy::new(|| {
  let models = build_omni_gen_mesh_models();
  let providers = build_omni_gen_mesh_model_providers();
  OmniGenMeshModelsResponse {
    success: true,
    models,
    providers,
  }
});

fn build_omni_gen_mesh_models() -> Vec<OmniGenMeshModelDetails> {
  let mut models = Vec::new();

  // Hunyuan 3D 2.0: image-to-3D only (exactly one input image).
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Hunyuan3d2p0,
    model_creator: Some(ModelCreator::Tencent),
    full_name: Some("Hunyuan 3D 2.0".to_string()),
    image_input_supported: Some(true),
    mesh_output_types: Some(vec![
      CommonMeshOutputType::Normal,
      CommonMeshOutputType::Geometry,
    ]),
    ..Default::default()
  });

  // Hunyuan 3D 2.1: image-to-3D only (exactly one input image).
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Hunyuan3d2p1,
    model_creator: Some(ModelCreator::Tencent),
    full_name: Some("Hunyuan 3D 2.1".to_string()),
    image_input_supported: Some(true),
    mesh_output_types: Some(vec![
      CommonMeshOutputType::Normal,
      CommonMeshOutputType::Geometry,
    ]),
    ..Default::default()
  });

  // Hunyuan 3D 3: text and/or image input with multi-view support and full
  // output shaping controls (output type, polygon type, face count, PBR).
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Hunyuan3d3,
    model_creator: Some(ModelCreator::Tencent),
    full_name: Some("Hunyuan 3D 3".to_string()),
    text_prompt_supported: Some(true),
    image_input_supported: Some(true),
    multi_view_supported: Some(true),
    mesh_output_types: Some(vec![
      CommonMeshOutputType::Normal,
      CommonMeshOutputType::LowPoly,
      CommonMeshOutputType::Geometry,
    ]),
    polygon_types: Some(vec![
      CommonPolygonType::Triangle,
      CommonPolygonType::Quad,
    ]),
    face_count_supported: Some(true),
    pbr_supported: Some(true),
    ..Default::default()
  });

  // Hunyuan 3D 3 Sketch: sketch-to-3D. Requires both a sketch image and a
  // text prompt.
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Hunyuan3d3Sketch,
    model_creator: Some(ModelCreator::Tencent),
    full_name: Some("Hunyuan 3D 3 Sketch".to_string()),
    text_prompt_supported: Some(true),
    sketch_input_supported: Some(true),
    face_count_supported: Some(true),
    pbr_supported: Some(true),
    ..Default::default()
  });

  // Hunyuan 3D 3.1 Pro: text or (multi-view) image input. No low-poly mode
  // or polygon type selection (unlike v3).
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Hunyuan3d3p1Pro,
    model_creator: Some(ModelCreator::Tencent),
    full_name: Some("Hunyuan 3D 3.1 Pro".to_string()),
    text_prompt_supported: Some(true),
    image_input_supported: Some(true),
    multi_view_supported: Some(true),
    mesh_output_types: Some(vec![
      CommonMeshOutputType::Normal,
      CommonMeshOutputType::Geometry,
    ]),
    face_count_supported: Some(true),
    pbr_supported: Some(true),
    ..Default::default()
  });

  // Hunyuan 3D 3.1 Rapid: the fast, low-cost tier. Text or single-image
  // input with a minimal option set.
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Hunyuan3d3p1Rapid,
    model_creator: Some(ModelCreator::Tencent),
    full_name: Some("Hunyuan 3D 3.1 Rapid".to_string()),
    extra_info_short: Some("Fast".to_string()),
    text_prompt_supported: Some(true),
    image_input_supported: Some(true),
    mesh_output_types: Some(vec![
      CommonMeshOutputType::Normal,
      CommonMeshOutputType::Geometry,
    ]),
    pbr_supported: Some(true),
    ..Default::default()
  });

  // Hunyuan 3D 3.1 Part: splits an existing mesh (FBX) into semantic parts.
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Hunyuan3d3p1Part,
    model_creator: Some(ModelCreator::Tencent),
    full_name: Some("Hunyuan 3D 3.1 Part".to_string()),
    extra_info: Some("Splits an existing 3D mesh into semantically meaningful parts".to_string()),
    extra_info_short: Some("Mesh splitting".to_string()),
    mesh_input_supported: Some(true),
    ..Default::default()
  });

  // Hunyuan 3D 3.1 Smart Topology: retopologizes an existing mesh (GLB/OBJ).
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Hunyuan3d3p1SmartTopology,
    model_creator: Some(ModelCreator::Tencent),
    full_name: Some("Hunyuan 3D 3.1 Smart Topology".to_string()),
    extra_info: Some("Retopologizes an existing 3D mesh into a cleaner, more efficient topology".to_string()),
    extra_info_short: Some("Retopology".to_string()),
    mesh_input_supported: Some(true),
    polygon_types: Some(vec![
      CommonPolygonType::Triangle,
      CommonPolygonType::Quad,
    ]),
    ..Default::default()
  });

  // Tripo3D H3.1: text, single-image, or multi-view image input with
  // texture/geometry quality tiers and quad output.
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Tripo3dH3p1,
    model_creator: Some(ModelCreator::Tripo),
    full_name: Some("Tripo3D H3.1".to_string()),
    text_prompt_supported: Some(true),
    image_input_supported: Some(true),
    multi_view_supported: Some(true),
    mesh_output_types: Some(vec![
      CommonMeshOutputType::Normal,
      CommonMeshOutputType::Geometry,
    ]),
    polygon_types: Some(vec![
      CommonPolygonType::Triangle,
      CommonPolygonType::Quad,
    ]),
    face_count_supported: Some(true),
    pbr_supported: Some(true),
    texture_toggle_supported: Some(true),
    texture_quality_supported: Some(true),
    geometry_quality_supported: Some(true),
    ..Default::default()
  });

  // Meshy 6: text or single-image input with low-poly mode and quad output.
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::MeshyV6,
    model_creator: Some(ModelCreator::Meshy),
    full_name: Some("Meshy 6".to_string()),
    text_prompt_supported: Some(true),
    image_input_supported: Some(true),
    mesh_output_types: Some(vec![
      CommonMeshOutputType::Normal,
      CommonMeshOutputType::LowPoly,
      CommonMeshOutputType::Geometry,
    ]),
    polygon_types: Some(vec![
      CommonPolygonType::Triangle,
      CommonPolygonType::Quad,
    ]),
    face_count_supported: Some(true),
    pbr_supported: Some(true),
    texture_toggle_supported: Some(true),
    ..Default::default()
  });

  // Rodin 2.5 Fast: text or image(s) input; fast, low-cost.
  models.push(OmniGenMeshModelDetails {
    model: CommonMeshModel::Rodin2p5Fast,
    model_creator: Some(ModelCreator::Deemos),
    full_name: Some("Rodin 2.5 Fast".to_string()),
    extra_info_short: Some("Fast".to_string()),
    text_prompt_supported: Some(true),
    image_input_supported: Some(true),
    mesh_output_types: Some(vec![
      CommonMeshOutputType::Normal,
      CommonMeshOutputType::Geometry,
    ]),
    pbr_supported: Some(true),
    texture_toggle_supported: Some(true),
    ..Default::default()
  });

  models
}

fn build_omni_gen_mesh_model_providers() -> Vec<OmniGenMeshModelProviderDetails> {
  let mut providers = Vec::new();

  providers.push(OmniGenMeshModelProviderDetails {
    provider: GenerationProvider::Artcraft,
    models: vec![
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Hunyuan3d2p0,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Hunyuan3d2p1,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Hunyuan3d3,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Hunyuan3d3Sketch,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Hunyuan3d3p1Pro,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Hunyuan3d3p1Rapid,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Hunyuan3d3p1Part,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Hunyuan3d3p1SmartTopology,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Tripo3dH3p1,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::MeshyV6,
        overrides: None,
      },
      OmniGenMeshProviderModelDetails {
        model: CommonMeshModel::Rodin2p5Fast,
        overrides: None,
      },
    ],
  });

  providers
}
