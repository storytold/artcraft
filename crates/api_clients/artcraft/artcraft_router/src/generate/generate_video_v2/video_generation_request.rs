use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::cost::ArtcraftSeedance2p0CostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::request::ArtcraftSeedance2p0RequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::cost::ArtcraftSeedance2p0FastCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::request::ArtcraftSeedance2p0FastRequestState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::cost::KinoviSeedance2p0CostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::cost::KinoviSeedance2p0FastCostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::request::KinoviSeedance2p0FastRequestState;

#[derive(Clone, Debug)]
pub enum VideoGenerationRequest {
  ArtcraftSeedance2p0(ArtcraftSeedance2p0RequestState),
  ArtcraftSeedance2p0Fast(ArtcraftSeedance2p0FastRequestState),
  KinoviSeedance2p0(KinoviSeedance2p0RequestState),
  KinoviSeedance2p0Fast(KinoviSeedance2p0FastRequestState),
}

impl VideoGenerationRequest {

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      VideoGenerationRequest::ArtcraftSeedance2p0(request) => Ok(ArtcraftSeedance2p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0Fast(request) => Ok(ArtcraftSeedance2p0FastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::KinoviSeedance2p0(request) => Ok(KinoviSeedance2p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::KinoviSeedance2p0Fast(request) => Ok(KinoviSeedance2p0FastCostState::from_request(request).estimate_cost()),
    }
  }

  /// Send the video generation request
  /// If successful, returns the job IDs.
  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match self {
      VideoGenerationRequest::ArtcraftSeedance2p0(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSeedance2p0Fast(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::KinoviSeedance2p0(request) => {
        let client_ref = client.get_seedance2pro_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::KinoviSeedance2p0Fast(request) => {
        let client_ref = client.get_seedance2pro_client_ref()?;
        request.send(client_ref).await
      },
    }
  }
}
