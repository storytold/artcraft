use enums::common::generation::common_mesh_model::CommonMeshModel as CommonMeshModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::artcraft::build_common::build_artcraft_omni_mesh_request;
use crate::generate::generate_mesh::providers::artcraft::hunyuan_3d_2p0::request::ArtcraftHunyuan3d2p0RequestState;

pub fn build_artcraft_hunyuan_3d_2p0(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_mesh_request(builder, CommonMeshModelEnum::Hunyuan3d2p0)?;
  let state = ArtcraftHunyuan3d2p0RequestState { request };
  Ok(MeshGenerationDraftOrRequest::Request(MeshGenerationRequest::ArtcraftHunyuan3d2p0(state)))
}
