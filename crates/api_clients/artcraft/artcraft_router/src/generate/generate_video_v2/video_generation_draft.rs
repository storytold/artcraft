use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::draft::KinoviSeedance2p0DraftState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

#[derive(Clone, Debug)]
pub enum VideoGenerationDraftRequest {
  KinoviSeedance2p0(KinoviSeedance2p0DraftState),
}

impl VideoGenerationDraftRequest {

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      VideoGenerationDraftRequest::KinoviSeedance2p0(draft) => Ok(draft.estimate_cost()),
    }
  }

  /// Finalize the draft request before generation
  /// This may involve uploading media to the provider.
  pub async fn finalize(self, client: &RouterClient) -> Result<VideoGenerationRequest, ArtcraftRouterError> {
    match self {
      VideoGenerationDraftRequest::KinoviSeedance2p0(draft) => {
        let client_ref = client.get_seedance2pro_client_ref()?;
        let result = KinoviSeedance2p0RequestState::from_draft(draft, client_ref).await?;
        Ok(VideoGenerationRequest::KinoviSeedance2p0(result))
      },
    }
  }
}
