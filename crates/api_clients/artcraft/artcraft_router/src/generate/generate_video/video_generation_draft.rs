use crate::api::router_provider::RouterProvider;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::kinovi::happy_horse_1p0::cost::KinoviHappyHorse1p0CostState;
use crate::generate::generate_video::providers::kinovi::happy_horse_1p0::draft::KinoviHappyHorse1p0DraftState;
use crate::generate::generate_video::providers::kinovi::seedance_2p0::cost::KinoviSeedance2p0CostState;
use crate::generate::generate_video::providers::kinovi::seedance_2p0::draft::KinoviSeedance2p0DraftState;
use crate::generate::generate_video::providers::kinovi::seedance_2p0_fast::cost::KinoviSeedance2p0FastCostState;
use crate::generate::generate_video::providers::kinovi::seedance_2p0_fast::draft::KinoviSeedance2p0FastDraftState;
use crate::generate::generate_video::providers::kinovi::seedance_2p0_mini::cost::KinoviSeedance2p0MiniCostState;
use crate::generate::generate_video::providers::kinovi::seedance_2p0_mini::draft::KinoviSeedance2p0MiniDraftState;
use crate::generate::generate_video::video_generation_draft_context::VideoGenerationDraftContext;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

/**
 * Wrapper for all video generation draft requests.
 */
#[derive(Clone, Debug)]
pub enum VideoGenerationDraftRequest {
  KinoviHappyHorse1p0(KinoviHappyHorse1p0DraftState),
  KinoviSeedance2p0(KinoviSeedance2p0DraftState),
  KinoviSeedance2p0Fast(KinoviSeedance2p0FastDraftState),
  KinoviSeedance2p0Mini(KinoviSeedance2p0MiniDraftState),
}

impl VideoGenerationDraftRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::KinoviHappyHorse1p0(_) => RouterProvider::Seedance2Pro,
      Self::KinoviSeedance2p0(_) => RouterProvider::Seedance2Pro,
      Self::KinoviSeedance2p0Fast(_) => RouterProvider::Seedance2Pro,
      Self::KinoviSeedance2p0Mini(_) => RouterProvider::Seedance2Pro,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      VideoGenerationDraftRequest::KinoviHappyHorse1p0(draft) => Ok(KinoviHappyHorse1p0CostState::from_draft(draft).estimate_cost()),
      VideoGenerationDraftRequest::KinoviSeedance2p0(draft) => Ok(KinoviSeedance2p0CostState::from_draft(draft).estimate_cost()),
      VideoGenerationDraftRequest::KinoviSeedance2p0Fast(draft) => Ok(KinoviSeedance2p0FastCostState::from_draft(draft).estimate_cost()),
      VideoGenerationDraftRequest::KinoviSeedance2p0Mini(draft) => Ok(KinoviSeedance2p0MiniCostState::from_draft(draft).estimate_cost()),
    }
  }

  /// Finalize the draft request before generation
  /// This may involve uploading media to the provider.
  pub async fn finalize(self, draft_context: VideoGenerationDraftContext<'_>) -> Result<VideoGenerationRequest, ArtcraftRouterError> {
    match self {
      VideoGenerationDraftRequest::KinoviHappyHorse1p0(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(VideoGenerationRequest::KinoviHappyHorse1p0(result))
      },
      VideoGenerationDraftRequest::KinoviSeedance2p0(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(VideoGenerationRequest::KinoviSeedance2p0(result))
      },
      VideoGenerationDraftRequest::KinoviSeedance2p0Fast(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(VideoGenerationRequest::KinoviSeedance2p0Fast(result))
      },
      VideoGenerationDraftRequest::KinoviSeedance2p0Mini(mut draft) => {
        let result = draft.to_request(&draft_context).await?;
        Ok(VideoGenerationRequest::KinoviSeedance2p0Mini(result))
      },
    }
  }
}
