use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::draft_request::KinoviSeedance2p0DraftRequest;

#[derive(Clone, Debug)]
pub enum VideoGenerationDraft {
  KinoviSeedance2p0(KinoviSeedance2p0DraftRequest),
}

impl VideoGenerationDraft {
  
  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      VideoGenerationDraft::KinoviSeedance2p0(draft) => Ok(draft.estimate_cost()),
    }
  }
  
  pub fn prepare_final(&self) -> Result<(), String> {
    match self {
      VideoGenerationDraft::KinoviSeedance2p0(plan) => plan.prepare_final(),
    }
  }
}
