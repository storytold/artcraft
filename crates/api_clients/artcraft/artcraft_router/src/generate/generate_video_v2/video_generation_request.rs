use crate::api::provider::Provider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::happy_horse_1p0::cost::ArtcraftHappyHorse1p0CostState;
use crate::generate::generate_video_v2::providers::artcraft::happy_horse_1p0::request::ArtcraftHappyHorse1p0RequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::cost::ArtcraftSeedance2p0CostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::request::ArtcraftSeedance2p0RequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::cost::ArtcraftSeedance2p0FastCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::request::ArtcraftSeedance2p0FastRequestState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_g::cost::GmiCloudSeedance2p0GCostState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_g::request::GmiCloudSeedance2p0GRequestState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_fast_g::cost::GmiCloudSeedance2p0FastGCostState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_fast_g::request::GmiCloudSeedance2p0FastGRequestState;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::cost::KinoviHappyHorse1p0CostState;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::request::KinoviHappyHorse1p0RequestState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::cost::KinoviSeedance2p0CostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::cost::KinoviSeedance2p0FastCostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::request::KinoviSeedance2p0FastRequestState;

#[derive(Clone, Debug)]
pub enum VideoGenerationRequest {
  ArtcraftHappyHorse1p0(ArtcraftHappyHorse1p0RequestState),
  ArtcraftSeedance2p0(ArtcraftSeedance2p0RequestState),
  ArtcraftSeedance2p0Fast(ArtcraftSeedance2p0FastRequestState),
  GmiCloudSeedance2p0G(GmiCloudSeedance2p0GRequestState),
  GmiCloudSeedance2p0FastG(GmiCloudSeedance2p0FastGRequestState),
  KinoviHappyHorse1p0(KinoviHappyHorse1p0RequestState),
  KinoviSeedance2p0(KinoviSeedance2p0RequestState),
  KinoviSeedance2p0Fast(KinoviSeedance2p0FastRequestState),
}

impl VideoGenerationRequest {

  pub fn get_provider(&self) -> Provider {
    match self {
      Self::ArtcraftHappyHorse1p0(_) => Provider::Artcraft,
      Self::ArtcraftSeedance2p0(_) => Provider::Artcraft,
      Self::ArtcraftSeedance2p0Fast(_) => Provider::Artcraft,
      Self::GmiCloudSeedance2p0G(_) => Provider::GmiCloud,
      Self::GmiCloudSeedance2p0FastG(_) => Provider::GmiCloud,
      Self::KinoviHappyHorse1p0(_) => Provider::Seedance2Pro,
      Self::KinoviSeedance2p0(_) => Provider::Seedance2Pro,
      Self::KinoviSeedance2p0Fast(_) => Provider::Seedance2Pro,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      VideoGenerationRequest::ArtcraftHappyHorse1p0(request) => Ok(ArtcraftHappyHorse1p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0(request) => Ok(ArtcraftSeedance2p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0Fast(request) => Ok(ArtcraftSeedance2p0FastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::GmiCloudSeedance2p0G(request) => Ok(GmiCloudSeedance2p0GCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::GmiCloudSeedance2p0FastG(request) => Ok(GmiCloudSeedance2p0FastGCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::KinoviHappyHorse1p0(request) => Ok(KinoviHappyHorse1p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::KinoviSeedance2p0(request) => Ok(KinoviSeedance2p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::KinoviSeedance2p0Fast(request) => Ok(KinoviSeedance2p0FastCostState::from_request(request).estimate_cost()),
    }
  }

  /// Send the video generation request
  /// If successful, returns the job IDs.
  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match self {
      VideoGenerationRequest::ArtcraftHappyHorse1p0(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSeedance2p0(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSeedance2p0Fast(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::GmiCloudSeedance2p0G(request) => {
        let client_ref = client.get_gmicloud_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::GmiCloudSeedance2p0FastG(request) => {
        let client_ref = client.get_gmicloud_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::KinoviHappyHorse1p0(request) => {
        let client_ref = client.get_seedance2pro_client_ref()?;
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
