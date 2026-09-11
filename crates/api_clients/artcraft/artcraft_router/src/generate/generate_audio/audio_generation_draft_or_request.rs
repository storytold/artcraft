use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_audio::audio_generation_cost_estimate::AudioGenerationCostEstimate;
use crate::generate::generate_audio::audio_generation_draft::AudioGenerationDraftRequest;
use crate::generate::generate_audio::audio_generation_request::AudioGenerationRequest;

#[derive(Debug, Clone)]
pub enum AudioGenerationDraftOrRequest {
  Draft(AudioGenerationDraftRequest),
  Request(AudioGenerationRequest),
}

impl AudioGenerationDraftOrRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::Draft(draft) => draft.get_provider(),
      Self::Request(request) => request.get_provider(),
    }
  }

  pub fn estimate_cost(&self) -> Result<AudioGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      AudioGenerationDraftOrRequest::Draft(draft) => draft.estimate_cost(),
      AudioGenerationDraftOrRequest::Request(request) => request.estimate_cost(),
    }
  }
}
