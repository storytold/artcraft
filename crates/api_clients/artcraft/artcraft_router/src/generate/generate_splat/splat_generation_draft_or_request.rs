use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;
use crate::generate::generate_splat::splat_generation_draft::SplatGenerationDraftRequest;
use crate::generate::generate_splat::splat_generation_request::SplatGenerationRequest;

#[derive(Debug, Clone)]
pub enum SplatGenerationDraftOrRequest {
  Draft(SplatGenerationDraftRequest),
  Request(SplatGenerationRequest),
}

impl SplatGenerationDraftOrRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::Draft(draft) => draft.get_provider(),
      Self::Request(request) => request.get_provider(),
    }
  }

  pub fn estimate_cost(&self) -> Result<SplatGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      SplatGenerationDraftOrRequest::Draft(draft) => draft.estimate_cost(),
      SplatGenerationDraftOrRequest::Request(request) => request.estimate_cost(),
    }
  }
}
