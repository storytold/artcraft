use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::cost::KinoviSeedance2p0CostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::draft::KinoviSeedance2p0DraftState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::cost::KinoviSeedance2p0FastCostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::draft::KinoviSeedance2p0FastDraftState;
use crate::generate::generate_video_v2::video_generation_draft_context::VideoGenerationDraftContext;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

/**
 * Wrapper for all video generation draft requests.
 */
#[derive(Clone, Debug)]
pub enum VideoGenerationDraftRequest {
  KinoviSeedance2p0(KinoviSeedance2p0DraftState),
  KinoviSeedance2p0Fast(KinoviSeedance2p0FastDraftState),
}

impl VideoGenerationDraftRequest {

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      VideoGenerationDraftRequest::KinoviSeedance2p0(draft) => Ok(KinoviSeedance2p0CostState::from_draft(draft).estimate_cost()),
      VideoGenerationDraftRequest::KinoviSeedance2p0Fast(draft) => Ok(KinoviSeedance2p0FastCostState::from_draft(draft).estimate_cost()),
    }
  }

  /// Finalize the draft request before generation
  /// This may involve uploading media to the provider.
  pub async fn finalize(self, draft_context: VideoGenerationDraftContext<'_>) -> Result<VideoGenerationRequest, ArtcraftRouterError> {
    match self {
      VideoGenerationDraftRequest::KinoviSeedance2p0(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(VideoGenerationRequest::KinoviSeedance2p0(result))
      },
      VideoGenerationDraftRequest::KinoviSeedance2p0Fast(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(VideoGenerationRequest::KinoviSeedance2p0Fast(result))
      },
    }
  }
}
