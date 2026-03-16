use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;

#[derive(Debug, Clone)]
pub struct PlanMuapiSeedance2p0 {
  pub prompt: Option<String>,
  pub image_url: Option<String>,
  pub aspect_ratio: Option<CommonAspectRatio>,
  pub duration_seconds: Option<u16>,
}

pub fn plan_generate_video_muapi_seedance2p0(
  _request: &GenerateVideoRequest<'_>,
) -> Result<PlanMuapiSeedance2p0, ArtcraftRouterError> {
  todo!("plan_generate_video_muapi_seedance2p0")
}
