use crate::api::provider::Provider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video::cost::ArtcraftGrokImagineVideoCostState;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video::request::ArtcraftGrokImagineVideoRequestState;
use crate::generate::generate_video_v2::providers::artcraft::happy_horse_1p0::cost::ArtcraftHappyHorse1p0CostState;
use crate::generate::generate_video_v2::providers::artcraft::happy_horse_1p0::request::ArtcraftHappyHorse1p0RequestState;
use crate::generate::generate_video_v2::providers::artcraft::preview_model::cost::ArtcraftPreviewModelCostState;
use crate::generate::generate_video_v2::providers::artcraft::preview_model::request::ArtcraftPreviewModelRequestState;
use crate::generate::generate_video_v2::providers::artcraft::preview_model_fast::cost::ArtcraftPreviewModelFastCostState;
use crate::generate::generate_video_v2::providers::artcraft::preview_model_fast::request::ArtcraftPreviewModelFastRequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::cost::ArtcraftSeedance2p0CostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::request::ArtcraftSeedance2p0RequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::cost::ArtcraftSeedance2p0FastCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::request::ArtcraftSeedance2p0FastRequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_u::cost::ArtcraftSeedance2p0UltraCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_u::request::ArtcraftSeedance2p0UltraRequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_u_fast::cost::ArtcraftSeedance2p0UltraFastCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_u_fast::request::ArtcraftSeedance2p0UltraFastRequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bp::cost::ArtcraftSeedance2p0BytePlusCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bp::request::ArtcraftSeedance2p0BytePlusRequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bp_fast::cost::ArtcraftSeedance2p0BytePlusFastCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bp_fast::request::ArtcraftSeedance2p0BytePlusFastRequestState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_g::cost::GmiCloudSeedance2p0UltraCostState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_g::request::GmiCloudSeedance2p0UltraRequestState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_fast_g::cost::GmiCloudSeedance2p0UltraFastCostState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_fast_g::request::GmiCloudSeedance2p0UltraFastRequestState;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video::cost::GrokApiGrokImagineVideoCostState;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video::request::GrokApiGrokImagineVideoRequestState;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::cost::KinoviHappyHorse1p0CostState;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::request::KinoviHappyHorse1p0RequestState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::cost::KinoviSeedance2p0CostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::cost::KinoviSeedance2p0FastCostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::request::KinoviSeedance2p0FastRequestState;

#[derive(Clone, Debug)]
pub enum VideoGenerationRequest {
  ArtcraftGrokImagineVideo(ArtcraftGrokImagineVideoRequestState),
  ArtcraftHappyHorse1p0(ArtcraftHappyHorse1p0RequestState),
  ArtcraftPreviewModel(ArtcraftPreviewModelRequestState),
  ArtcraftPreviewModelFast(ArtcraftPreviewModelFastRequestState),
  ArtcraftSeedance2p0(ArtcraftSeedance2p0RequestState),
  ArtcraftSeedance2p0Fast(ArtcraftSeedance2p0FastRequestState),
  ArtcraftSeedance2p0Ultra(ArtcraftSeedance2p0UltraRequestState),
  ArtcraftSeedance2p0UltraFast(ArtcraftSeedance2p0UltraFastRequestState),
  ArtcraftSeedance2p0BytePlus(ArtcraftSeedance2p0BytePlusRequestState),
  ArtcraftSeedance2p0BytePlusFast(ArtcraftSeedance2p0BytePlusFastRequestState),
  GmiCloudSeedance2p0Ultra(GmiCloudSeedance2p0UltraRequestState),
  GmiCloudSeedance2p0UltraFast(GmiCloudSeedance2p0UltraFastRequestState),
  GrokApiGrokImagineVideo(GrokApiGrokImagineVideoRequestState),
  KinoviHappyHorse1p0(KinoviHappyHorse1p0RequestState),
  KinoviSeedance2p0(KinoviSeedance2p0RequestState),
  KinoviSeedance2p0Fast(KinoviSeedance2p0FastRequestState),
}

impl VideoGenerationRequest {

  pub fn get_provider(&self) -> Provider {
    match self {
      Self::ArtcraftGrokImagineVideo(_) => Provider::Artcraft,
      Self::ArtcraftHappyHorse1p0(_) => Provider::Artcraft,
      Self::ArtcraftPreviewModel(_) => Provider::Artcraft,
      Self::ArtcraftPreviewModelFast(_) => Provider::Artcraft,
      Self::ArtcraftSeedance2p0(_) => Provider::Artcraft,
      Self::ArtcraftSeedance2p0Fast(_) => Provider::Artcraft,
      Self::ArtcraftSeedance2p0Ultra(_) => Provider::Artcraft,
      Self::ArtcraftSeedance2p0UltraFast(_) => Provider::Artcraft,
      Self::ArtcraftSeedance2p0BytePlus(_) => Provider::Artcraft,
      Self::ArtcraftSeedance2p0BytePlusFast(_) => Provider::Artcraft,
      Self::GmiCloudSeedance2p0Ultra(_) => Provider::GmiCloud,
      Self::GmiCloudSeedance2p0UltraFast(_) => Provider::GmiCloud,
      Self::GrokApiGrokImagineVideo(_) => Provider::GrokApi,
      Self::KinoviHappyHorse1p0(_) => Provider::Seedance2Pro,
      Self::KinoviSeedance2p0(_) => Provider::Seedance2Pro,
      Self::KinoviSeedance2p0Fast(_) => Provider::Seedance2Pro,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      VideoGenerationRequest::ArtcraftGrokImagineVideo(request) => Ok(ArtcraftGrokImagineVideoCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftHappyHorse1p0(request) => Ok(ArtcraftHappyHorse1p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftPreviewModel(request) => Ok(ArtcraftPreviewModelCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftPreviewModelFast(request) => Ok(ArtcraftPreviewModelFastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0(request) => Ok(ArtcraftSeedance2p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0Fast(request) => Ok(ArtcraftSeedance2p0FastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0Ultra(request) => Ok(ArtcraftSeedance2p0UltraCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0UltraFast(request) => Ok(ArtcraftSeedance2p0UltraFastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlus(request) => Ok(ArtcraftSeedance2p0BytePlusCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlusFast(request) => Ok(ArtcraftSeedance2p0BytePlusFastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::GmiCloudSeedance2p0Ultra(request) => Ok(GmiCloudSeedance2p0UltraCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::GmiCloudSeedance2p0UltraFast(request) => Ok(GmiCloudSeedance2p0UltraFastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::GrokApiGrokImagineVideo(request) => Ok(GrokApiGrokImagineVideoCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::KinoviHappyHorse1p0(request) => Ok(KinoviHappyHorse1p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::KinoviSeedance2p0(request) => Ok(KinoviSeedance2p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::KinoviSeedance2p0Fast(request) => Ok(KinoviSeedance2p0FastCostState::from_request(request).estimate_cost()),
    }
  }

  /// Send the video generation request
  /// If successful, returns the job IDs.
  pub async fn send_request(&self, client: &RouterClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match self {
      VideoGenerationRequest::ArtcraftGrokImagineVideo(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftHappyHorse1p0(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftPreviewModel(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftPreviewModelFast(request) => {
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
      VideoGenerationRequest::ArtcraftSeedance2p0Ultra(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSeedance2p0UltraFast(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlus(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlusFast(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::GmiCloudSeedance2p0Ultra(request) => {
        let client_ref = client.get_gmicloud_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::GmiCloudSeedance2p0UltraFast(request) => {
        let client_ref = client.get_gmicloud_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::GrokApiGrokImagineVideo(request) => {
        let client_ref = client.get_grok_api_client_ref()?;
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
