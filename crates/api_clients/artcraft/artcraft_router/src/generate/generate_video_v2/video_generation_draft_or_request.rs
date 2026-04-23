use crate::api::provider::Provider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub enum VideoGenerationDraftOrRequest {
  Draft(VideoGenerationDraftRequest),
  Request(VideoGenerationRequest),
}

impl VideoGenerationDraftOrRequest {

  pub fn get_provider(&self) -> Provider {
    match self {
      Self::Draft(draft) => draft.get_provider(),
      Self::Request(request) => request.get_provider(),
    }
  }

  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      VideoGenerationDraftOrRequest::Draft(draft) => draft.estimate_cost(),
      VideoGenerationDraftOrRequest::Request(request) => request.estimate_cost(),
    }
  }
}