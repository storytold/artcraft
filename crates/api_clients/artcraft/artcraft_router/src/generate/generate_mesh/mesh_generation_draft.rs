use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_mesh::mesh_generation_cost_estimate::MeshGenerationCostEstimate;
use crate::generate::generate_mesh::mesh_generation_draft_context::MeshGenerationDraftContext;
use crate::generate::generate_mesh::mesh_generation_request::MeshGenerationRequest;

/**
 * Wrapper for all mesh generation draft requests.
 *
 * No mesh provider currently needs a draft phase: fal takes media URLs
 * directly and Artcraft takes media tokens, so `build2()` always returns a
 * `Request`. The enum exists so the mesh pipeline matches the audio/image
 * draft-or-request shape and providers that need pre-upload can slot in
 * later.
 */
#[derive(Clone, Debug)]
pub enum MeshGenerationDraftRequest {}

impl MeshGenerationDraftRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match *self {}
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<MeshGenerationCostEstimate, ArtcraftRouterError> {
    match *self {}
  }

  /// Finalize the draft request before generation
  /// This may involve uploading media to the provider.
  pub async fn finalize(self, _draft_context: MeshGenerationDraftContext<'_>) -> Result<MeshGenerationRequest, ArtcraftRouterError> {
    match self {}
  }
}
