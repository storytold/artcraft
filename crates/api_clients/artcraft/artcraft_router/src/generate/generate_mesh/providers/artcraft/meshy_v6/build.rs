use enums::common::generation::common_mesh_model::CommonMeshModel as CommonMeshModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use crate::generate::generate_mesh::mesh_generation_draft_or_request::MeshGenerationDraftOrRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;
use crate::generate::generate_mesh::providers::artcraft::build_common::build_artcraft_omni_mesh_request;
use crate::generate::generate_mesh::providers::artcraft::meshy_v6::request::ArtcraftMeshyV6RequestState;

pub fn build_artcraft_meshy_v6(builder: GenerateMeshRequestBuilder) -> Result<MeshGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_mesh_request(builder, CommonMeshModelEnum::MeshyV6)?;
  let state = ArtcraftMeshyV6RequestState { request };
  Ok(MeshGenerationDraftOrRequest::Request(MeshGenerationRequest::ArtcraftMeshyV6(state)))
}
