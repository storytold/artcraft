use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::image_generation_draft::ImageGenerationDraftRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;

#[derive(Debug, Clone)]
pub enum ImageGenerationDraftOrRequest {
  Draft(ImageGenerationDraftRequest),
  Request(ImageGenerationRequest),
}

impl ImageGenerationDraftOrRequest {
  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::Draft(draft) => draft.get_provider(),
      Self::Request(request) => request.get_provider(),
    }
  }

  pub fn estimate_cost(&self) -> Result<ImageGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      Self::Draft(draft) => draft.estimate_cost(),
      Self::Request(request) => request.estimate_cost(),
    }
  }
}
