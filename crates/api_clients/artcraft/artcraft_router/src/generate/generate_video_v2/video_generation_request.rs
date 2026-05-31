use crate::api::router_provider::RouterProvider;
use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video::cost::ArtcraftGrokImagineVideoCostState;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video::request::ArtcraftGrokImagineVideoRequestState;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video_1p5::cost::ArtcraftGrokImagineVideo1p5CostState;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video_1p5::request::ArtcraftGrokImagineVideo1p5RequestState;
use crate::generate::generate_video_v2::providers::artcraft::happy_horse_1p0::cost::ArtcraftHappyHorse1p0CostState;
use crate::generate::generate_video_v2::providers::artcraft::happy_horse_1p0::request::ArtcraftHappyHorse1p0RequestState;
use crate::generate::generate_video_v2::providers::artcraft::kling_1_6_pro::cost::ArtcraftKling16ProCostState;
use crate::generate::generate_video_v2::providers::artcraft::kling_1_6_pro::request::ArtcraftKling16ProRequestState;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_1_master::cost::ArtcraftKling21MasterCostState;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_1_master::request::ArtcraftKling21MasterRequestState;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_1_pro::cost::ArtcraftKling21ProCostState;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_1_pro::request::ArtcraftKling21ProRequestState;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_5_turbo_pro::cost::ArtcraftKling2p5TurboProCostState;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_5_turbo_pro::request::ArtcraftKling2p5TurboProRequestState;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_6_pro::cost::ArtcraftKling2p6ProCostState;
use crate::generate::generate_video_v2::providers::artcraft::kling_2_6_pro::request::ArtcraftKling2p6ProRequestState;
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_pro::cost::ArtcraftKling3p0ProCostState;
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_pro::request::ArtcraftKling3p0ProRequestState;
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_standard::cost::ArtcraftKling3p0StandardCostState;
use crate::generate::generate_video_v2::providers::artcraft::kling_3p0_standard::request::ArtcraftKling3p0StandardRequestState;
use crate::generate::generate_video_v2::providers::artcraft::preview_model::cost::ArtcraftPreviewModelCostState;
use crate::generate::generate_video_v2::providers::artcraft::preview_model::request::ArtcraftPreviewModelRequestState;
use crate::generate::generate_video_v2::providers::artcraft::preview_model_fast::cost::ArtcraftPreviewModelFastCostState;
use crate::generate::generate_video_v2::providers::artcraft::preview_model_fast::request::ArtcraftPreviewModelFastRequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_1p0_lite::cost::ArtcraftSeedance10LiteCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_1p0_lite::request::ArtcraftSeedance10LiteRequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_1p5_pro::cost::ArtcraftSeedance1p5ProCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_1p5_pro::request::ArtcraftSeedance1p5ProRequestState;
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
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bpu::cost::ArtcraftSeedance2p0BytePlusUltraCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bpu::request::ArtcraftSeedance2p0BytePlusUltraRequestState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bpu_fast::cost::ArtcraftSeedance2p0BytePlusUltraFastCostState;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_bpu_fast::request::ArtcraftSeedance2p0BytePlusUltraFastRequestState;
use crate::generate::generate_video_v2::providers::artcraft::sora_2::cost::ArtcraftSora2CostState;
use crate::generate::generate_video_v2::providers::artcraft::sora_2::request::ArtcraftSora2RequestState;
use crate::generate::generate_video_v2::providers::artcraft::sora_2_pro::cost::ArtcraftSora2ProCostState;
use crate::generate::generate_video_v2::providers::artcraft::sora_2_pro::request::ArtcraftSora2ProRequestState;
use crate::generate::generate_video_v2::providers::artcraft::veo_2::cost::ArtcraftVeo2CostState;
use crate::generate::generate_video_v2::providers::artcraft::veo_2::request::ArtcraftVeo2RequestState;
use crate::generate::generate_video_v2::providers::artcraft::veo_3::cost::ArtcraftVeo3CostState;
use crate::generate::generate_video_v2::providers::artcraft::veo_3::request::ArtcraftVeo3RequestState;
use crate::generate::generate_video_v2::providers::artcraft::veo_3_fast::cost::ArtcraftVeo3FastCostState;
use crate::generate::generate_video_v2::providers::artcraft::veo_3_fast::request::ArtcraftVeo3FastRequestState;
use crate::generate::generate_video_v2::providers::artcraft::veo_3p1::cost::ArtcraftVeo3p1CostState;
use crate::generate::generate_video_v2::providers::artcraft::veo_3p1::request::ArtcraftVeo3p1RequestState;
use crate::generate::generate_video_v2::providers::artcraft::veo_3p1_fast::cost::ArtcraftVeo3p1FastCostState;
use crate::generate::generate_video_v2::providers::artcraft::veo_3p1_fast::request::ArtcraftVeo3p1FastRequestState;
use crate::generate::generate_video_v2::providers::fal::kling_1_6_pro::cost::FalKling16ProCostState;
use crate::generate::generate_video_v2::providers::fal::kling_1_6_pro::request::FalKling16ProRequestState;
use crate::generate::generate_video_v2::providers::fal::kling_2_1_master::cost::FalKling21MasterCostState;
use crate::generate::generate_video_v2::providers::fal::kling_2_1_master::request::FalKling21MasterRequestState;
use crate::generate::generate_video_v2::providers::fal::kling_2_1_pro::cost::FalKling21ProCostState;
use crate::generate::generate_video_v2::providers::fal::kling_2_1_pro::request::FalKling21ProRequestState;
use crate::generate::generate_video_v2::providers::fal::kling_2_5_turbo_pro::cost::FalKling2p5TurboProCostState;
use crate::generate::generate_video_v2::providers::fal::kling_2_5_turbo_pro::request::FalKling2p5TurboProRequestState;
use crate::generate::generate_video_v2::providers::fal::kling_2_6_pro::cost::FalKling2p6ProCostState;
use crate::generate::generate_video_v2::providers::fal::kling_2_6_pro::request::FalKling2p6ProRequestState;
use crate::generate::generate_video_v2::providers::fal::kling_3p0_pro::cost::FalKling3p0ProCostState;
use crate::generate::generate_video_v2::providers::fal::kling_3p0_pro::request::FalKling3p0ProRequestState;
use crate::generate::generate_video_v2::providers::fal::kling_3p0_standard::cost::FalKling3p0StandardCostState;
use crate::generate::generate_video_v2::providers::fal::kling_3p0_standard::request::FalKling3p0StandardRequestState;
use crate::generate::generate_video_v2::providers::fal::seedance_1p0_lite::cost::FalSeedance10LiteCostState;
use crate::generate::generate_video_v2::providers::fal::seedance_1p0_lite::request::FalSeedance10LiteRequestState;
use crate::generate::generate_video_v2::providers::fal::sora_2::cost::FalSora2CostState;
use crate::generate::generate_video_v2::providers::fal::sora_2::request::FalSora2RequestState;
use crate::generate::generate_video_v2::providers::fal::sora_2_pro::cost::FalSora2ProCostState;
use crate::generate::generate_video_v2::providers::fal::sora_2_pro::request::FalSora2ProRequestState;
use crate::generate::generate_video_v2::providers::fal::seedance_1p5_pro::cost::FalSeedance1p5ProCostState;
use crate::generate::generate_video_v2::providers::fal::seedance_1p5_pro::request::FalSeedance1p5ProRequestState;
use crate::generate::generate_video_v2::providers::fal::veo_2::cost::FalVeo2CostState;
use crate::generate::generate_video_v2::providers::fal::veo_2::request::FalVeo2RequestState;
use crate::generate::generate_video_v2::providers::fal::veo_3::cost::FalVeo3CostState;
use crate::generate::generate_video_v2::providers::fal::veo_3::request::FalVeo3RequestState;
use crate::generate::generate_video_v2::providers::fal::veo_3_fast::cost::FalVeo3FastCostState;
use crate::generate::generate_video_v2::providers::fal::veo_3_fast::request::FalVeo3FastRequestState;
use crate::generate::generate_video_v2::providers::fal::veo_3p1::cost::FalVeo3p1CostState;
use crate::generate::generate_video_v2::providers::fal::veo_3p1::request::FalVeo3p1RequestState;
use crate::generate::generate_video_v2::providers::fal::veo_3p1_fast::cost::FalVeo3p1FastCostState;
use crate::generate::generate_video_v2::providers::fal::veo_3p1_fast::request::FalVeo3p1FastRequestState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_g::cost::GmiCloudSeedance2p0UltraCostState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_g::request::GmiCloudSeedance2p0UltraRequestState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_fast_g::cost::GmiCloudSeedance2p0UltraFastCostState;
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_fast_g::request::GmiCloudSeedance2p0UltraFastRequestState;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video::cost::GrokApiGrokImagineVideoCostState;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video::request::GrokApiGrokImagineVideoRequestState;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video_1p5::cost::GrokApiGrokImagineVideo1p5CostState;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video_1p5::request::GrokApiGrokImagineVideo1p5RequestState;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::cost::KinoviHappyHorse1p0CostState;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::request::KinoviHappyHorse1p0RequestState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::cost::KinoviSeedance2p0CostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::cost::KinoviSeedance2p0FastCostState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0_fast::request::KinoviSeedance2p0FastRequestState;

#[derive(Clone, Debug)]
pub enum VideoGenerationRequest {
  ArtcraftGrokImagineVideo(ArtcraftGrokImagineVideoRequestState),
  ArtcraftGrokImagineVideo1p5(ArtcraftGrokImagineVideo1p5RequestState),
  ArtcraftHappyHorse1p0(ArtcraftHappyHorse1p0RequestState),
  ArtcraftKling16Pro(ArtcraftKling16ProRequestState),
  ArtcraftKling21Master(ArtcraftKling21MasterRequestState),
  ArtcraftKling21Pro(ArtcraftKling21ProRequestState),
  ArtcraftKling2p5TurboPro(ArtcraftKling2p5TurboProRequestState),
  ArtcraftKling2p6Pro(ArtcraftKling2p6ProRequestState),
  ArtcraftKling3p0Pro(ArtcraftKling3p0ProRequestState),
  ArtcraftKling3p0Standard(ArtcraftKling3p0StandardRequestState),
  ArtcraftPreviewModel(ArtcraftPreviewModelRequestState),
  ArtcraftPreviewModelFast(ArtcraftPreviewModelFastRequestState),
  ArtcraftSeedance10Lite(ArtcraftSeedance10LiteRequestState),
  ArtcraftSeedance1p5Pro(ArtcraftSeedance1p5ProRequestState),
  ArtcraftSeedance2p0(ArtcraftSeedance2p0RequestState),
  ArtcraftSeedance2p0Fast(ArtcraftSeedance2p0FastRequestState),
  ArtcraftSeedance2p0Ultra(ArtcraftSeedance2p0UltraRequestState),
  ArtcraftSeedance2p0UltraFast(ArtcraftSeedance2p0UltraFastRequestState),
  ArtcraftSeedance2p0BytePlus(ArtcraftSeedance2p0BytePlusRequestState),
  ArtcraftSeedance2p0BytePlusFast(ArtcraftSeedance2p0BytePlusFastRequestState),
  ArtcraftSeedance2p0BytePlusUltra(ArtcraftSeedance2p0BytePlusUltraRequestState),
  ArtcraftSeedance2p0BytePlusUltraFast(ArtcraftSeedance2p0BytePlusUltraFastRequestState),
  ArtcraftSora2(ArtcraftSora2RequestState),
  ArtcraftSora2Pro(ArtcraftSora2ProRequestState),
  ArtcraftVeo2(ArtcraftVeo2RequestState),
  ArtcraftVeo3(ArtcraftVeo3RequestState),
  ArtcraftVeo3Fast(ArtcraftVeo3FastRequestState),
  ArtcraftVeo3p1(ArtcraftVeo3p1RequestState),
  ArtcraftVeo3p1Fast(ArtcraftVeo3p1FastRequestState),
  FalKling16Pro(FalKling16ProRequestState),
  FalKling21Master(FalKling21MasterRequestState),
  FalKling21Pro(FalKling21ProRequestState),
  FalKling2p5TurboPro(FalKling2p5TurboProRequestState),
  FalKling2p6Pro(FalKling2p6ProRequestState),
  FalKling3p0Pro(FalKling3p0ProRequestState),
  FalKling3p0Standard(FalKling3p0StandardRequestState),
  FalSeedance10Lite(FalSeedance10LiteRequestState),
  FalSeedance1p5Pro(FalSeedance1p5ProRequestState),
  FalSora2(FalSora2RequestState),
  FalSora2Pro(FalSora2ProRequestState),
  FalVeo2(FalVeo2RequestState),
  FalVeo3(FalVeo3RequestState),
  FalVeo3Fast(FalVeo3FastRequestState),
  FalVeo3p1(FalVeo3p1RequestState),
  FalVeo3p1Fast(FalVeo3p1FastRequestState),
  GmiCloudSeedance2p0Ultra(GmiCloudSeedance2p0UltraRequestState),
  GmiCloudSeedance2p0UltraFast(GmiCloudSeedance2p0UltraFastRequestState),
  GrokApiGrokImagineVideo(GrokApiGrokImagineVideoRequestState),
  GrokApiGrokImagineVideo1p5(GrokApiGrokImagineVideo1p5RequestState),
  KinoviHappyHorse1p0(KinoviHappyHorse1p0RequestState),
  KinoviSeedance2p0(KinoviSeedance2p0RequestState),
  KinoviSeedance2p0Fast(KinoviSeedance2p0FastRequestState),
}

impl VideoGenerationRequest {

  pub fn get_provider(&self) -> RouterProvider {
    match self {
      Self::ArtcraftGrokImagineVideo(_) => RouterProvider::Artcraft,
      Self::ArtcraftGrokImagineVideo1p5(_) => RouterProvider::Artcraft,
      Self::ArtcraftHappyHorse1p0(_) => RouterProvider::Artcraft,
      Self::ArtcraftKling16Pro(_) => RouterProvider::Artcraft,
      Self::ArtcraftKling21Master(_) => RouterProvider::Artcraft,
      Self::ArtcraftKling21Pro(_) => RouterProvider::Artcraft,
      Self::ArtcraftKling2p5TurboPro(_) => RouterProvider::Artcraft,
      Self::ArtcraftKling2p6Pro(_) => RouterProvider::Artcraft,
      Self::ArtcraftKling3p0Pro(_) => RouterProvider::Artcraft,
      Self::ArtcraftKling3p0Standard(_) => RouterProvider::Artcraft,
      Self::ArtcraftPreviewModel(_) => RouterProvider::Artcraft,
      Self::ArtcraftPreviewModelFast(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance10Lite(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance1p5Pro(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance2p0(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance2p0Fast(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance2p0Ultra(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance2p0UltraFast(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance2p0BytePlus(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance2p0BytePlusFast(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance2p0BytePlusUltra(_) => RouterProvider::Artcraft,
      Self::ArtcraftSeedance2p0BytePlusUltraFast(_) => RouterProvider::Artcraft,
      Self::ArtcraftSora2(_) => RouterProvider::Artcraft,
      Self::ArtcraftSora2Pro(_) => RouterProvider::Artcraft,
      Self::ArtcraftVeo2(_) => RouterProvider::Artcraft,
      Self::ArtcraftVeo3(_) => RouterProvider::Artcraft,
      Self::ArtcraftVeo3Fast(_) => RouterProvider::Artcraft,
      Self::ArtcraftVeo3p1(_) => RouterProvider::Artcraft,
      Self::ArtcraftVeo3p1Fast(_) => RouterProvider::Artcraft,
      Self::FalKling16Pro(_) => RouterProvider::Fal,
      Self::FalKling21Master(_) => RouterProvider::Fal,
      Self::FalKling21Pro(_) => RouterProvider::Fal,
      Self::FalKling2p5TurboPro(_) => RouterProvider::Fal,
      Self::FalKling2p6Pro(_) => RouterProvider::Fal,
      Self::FalKling3p0Pro(_) => RouterProvider::Fal,
      Self::FalKling3p0Standard(_) => RouterProvider::Fal,
      Self::FalSeedance10Lite(_) => RouterProvider::Fal,
      Self::FalSeedance1p5Pro(_) => RouterProvider::Fal,
      Self::FalSora2(_) => RouterProvider::Fal,
      Self::FalSora2Pro(_) => RouterProvider::Fal,
      Self::FalVeo2(_) => RouterProvider::Fal,
      Self::FalVeo3(_) => RouterProvider::Fal,
      Self::FalVeo3Fast(_) => RouterProvider::Fal,
      Self::FalVeo3p1(_) => RouterProvider::Fal,
      Self::FalVeo3p1Fast(_) => RouterProvider::Fal,
      Self::GmiCloudSeedance2p0Ultra(_) => RouterProvider::GmiCloud,
      Self::GmiCloudSeedance2p0UltraFast(_) => RouterProvider::GmiCloud,
      Self::GrokApiGrokImagineVideo(_) => RouterProvider::GrokApi,
      Self::GrokApiGrokImagineVideo1p5(_) => RouterProvider::GrokApi,
      Self::KinoviHappyHorse1p0(_) => RouterProvider::Seedance2Pro,
      Self::KinoviSeedance2p0(_) => RouterProvider::Seedance2Pro,
      Self::KinoviSeedance2p0Fast(_) => RouterProvider::Seedance2Pro,
    }
  }

  /// Return a cost estimate to fulfill the request.
  pub fn estimate_cost(&self) -> Result<VideoGenerationCostEstimate, ArtcraftRouterError> {
    match self {
      VideoGenerationRequest::ArtcraftGrokImagineVideo(request) => Ok(ArtcraftGrokImagineVideoCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftGrokImagineVideo1p5(request) => Ok(ArtcraftGrokImagineVideo1p5CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftHappyHorse1p0(request) => Ok(ArtcraftHappyHorse1p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftKling16Pro(request) => Ok(ArtcraftKling16ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftKling21Master(request) => Ok(ArtcraftKling21MasterCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftKling21Pro(request) => Ok(ArtcraftKling21ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftKling2p5TurboPro(request) => Ok(ArtcraftKling2p5TurboProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftKling2p6Pro(request) => Ok(ArtcraftKling2p6ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftKling3p0Pro(request) => Ok(ArtcraftKling3p0ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftKling3p0Standard(request) => Ok(ArtcraftKling3p0StandardCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftPreviewModel(request) => Ok(ArtcraftPreviewModelCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftPreviewModelFast(request) => Ok(ArtcraftPreviewModelFastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance10Lite(request) => Ok(ArtcraftSeedance10LiteCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance1p5Pro(request) => Ok(ArtcraftSeedance1p5ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0(request) => Ok(ArtcraftSeedance2p0CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0Fast(request) => Ok(ArtcraftSeedance2p0FastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0Ultra(request) => Ok(ArtcraftSeedance2p0UltraCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0UltraFast(request) => Ok(ArtcraftSeedance2p0UltraFastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlus(request) => Ok(ArtcraftSeedance2p0BytePlusCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlusFast(request) => Ok(ArtcraftSeedance2p0BytePlusFastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlusUltra(request) => Ok(ArtcraftSeedance2p0BytePlusUltraCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlusUltraFast(request) => Ok(ArtcraftSeedance2p0BytePlusUltraFastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSora2(request) => Ok(ArtcraftSora2CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftSora2Pro(request) => Ok(ArtcraftSora2ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftVeo2(request) => Ok(ArtcraftVeo2CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftVeo3(request) => Ok(ArtcraftVeo3CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftVeo3Fast(request) => Ok(ArtcraftVeo3FastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftVeo3p1(request) => Ok(ArtcraftVeo3p1CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::ArtcraftVeo3p1Fast(request) => Ok(ArtcraftVeo3p1FastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalKling16Pro(request) => Ok(FalKling16ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalKling21Master(request) => Ok(FalKling21MasterCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalKling21Pro(request) => Ok(FalKling21ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalKling2p5TurboPro(request) => Ok(FalKling2p5TurboProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalKling2p6Pro(request) => Ok(FalKling2p6ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalKling3p0Pro(request) => Ok(FalKling3p0ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalKling3p0Standard(request) => Ok(FalKling3p0StandardCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalSeedance10Lite(request) => Ok(FalSeedance10LiteCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalSeedance1p5Pro(request) => Ok(FalSeedance1p5ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalSora2(request) => Ok(FalSora2CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalSora2Pro(request) => Ok(FalSora2ProCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalVeo2(request) => Ok(FalVeo2CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalVeo3(request) => Ok(FalVeo3CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalVeo3Fast(request) => Ok(FalVeo3FastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalVeo3p1(request) => Ok(FalVeo3p1CostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::FalVeo3p1Fast(request) => Ok(FalVeo3p1FastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::GmiCloudSeedance2p0Ultra(request) => Ok(GmiCloudSeedance2p0UltraCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::GmiCloudSeedance2p0UltraFast(request) => Ok(GmiCloudSeedance2p0UltraFastCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::GrokApiGrokImagineVideo(request) => Ok(GrokApiGrokImagineVideoCostState::from_request(request).estimate_cost()),
      VideoGenerationRequest::GrokApiGrokImagineVideo1p5(request) => Ok(GrokApiGrokImagineVideo1p5CostState::from_request(request).estimate_cost()),
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
      VideoGenerationRequest::ArtcraftGrokImagineVideo1p5(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftHappyHorse1p0(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftKling16Pro(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftKling21Master(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftKling21Pro(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftKling2p5TurboPro(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftKling2p6Pro(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftKling3p0Pro(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftKling3p0Standard(request) => {
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
      VideoGenerationRequest::ArtcraftSeedance10Lite(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSeedance1p5Pro(request) => {
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
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlusUltra(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSeedance2p0BytePlusUltraFast(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSora2(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftSora2Pro(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftVeo2(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftVeo3(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftVeo3Fast(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftVeo3p1(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::ArtcraftVeo3p1Fast(request) => {
        let client_ref = client.get_artcraft_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalKling16Pro(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalKling21Master(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalKling21Pro(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalKling2p5TurboPro(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalKling2p6Pro(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalKling3p0Pro(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalKling3p0Standard(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalSeedance10Lite(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalSeedance1p5Pro(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalSora2(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalSora2Pro(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalVeo2(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalVeo3(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalVeo3Fast(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalVeo3p1(request) => {
        let client_ref = client.get_fal_client_ref()?;
        request.send(client_ref).await
      },
      VideoGenerationRequest::FalVeo3p1Fast(request) => {
        let client_ref = client.get_fal_client_ref()?;
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
      VideoGenerationRequest::GrokApiGrokImagineVideo1p5(request) => {
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
