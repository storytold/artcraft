use crate::client::router_muapi_client::RouterMuapiClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::plan::muapi::plan_generate_video_muapi_seedance2p0::PlanMuapiSeedance2p0;

pub async fn execute_muapi_seedance2p0(
  _plan: &PlanMuapiSeedance2p0,
  _muapi_client: &RouterMuapiClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  todo!("execute_muapi_seedance2p0")
}
