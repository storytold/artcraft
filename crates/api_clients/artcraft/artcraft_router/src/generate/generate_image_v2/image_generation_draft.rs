use crate::api::provider::Provider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::image_generation_draft_context::ImageGenerationDraftContext;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;

/// Wrapper for all image generation draft requests.
///
/// Drafts hold validated/planned parameters but may still need media resolution
/// (e.g. uploading local files to a provider) before they can be sent.
/// Currently empty — FAL doesn't need a draft phase.
#[derive(Clone, Debug)]
pub enum ImageGenerationDraftRequest {
}

impl ImageGenerationDraftRequest {
  pub fn get_provider(&self) -> Provider {
    match *self {}
  }

  pub fn estimate_cost(&self) -> Result<ImageGenerationCostEstimate, ArtcraftRouterError> {
    match *self {}
  }

  pub async fn finalize(self, _draft_context: ImageGenerationDraftContext<'_>) -> Result<ImageGenerationRequest, ArtcraftRouterError> {
    match self {}
  }
}
