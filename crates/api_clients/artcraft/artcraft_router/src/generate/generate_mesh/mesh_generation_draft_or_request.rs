use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::mesh_generation_draft::MeshGenerationDraftRequest;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;

#[derive(Debug, Clone)]
pub enum MeshGenerationDraftOrRequest {
  Draft(MeshGenerationDraftRequest),
  Request(MeshGenerationRequest),
}

impl MeshGenerationDraftOrRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::Draft(draft) => draft.get_provider(),
      Self::Request(request) => request.get_provider(),
    }
  }

  pub fn estimate_cost(&self) -> Result<MeshGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      MeshGenerationDraftOrRequest::Draft(draft) => draft.estimate_cost(),
      MeshGenerationDraftOrRequest::Request(request) => request.estimate_cost(),
    }
  }
}
