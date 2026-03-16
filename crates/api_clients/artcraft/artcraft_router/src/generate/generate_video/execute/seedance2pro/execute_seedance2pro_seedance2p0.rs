use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0::PlanSeedance2proSeedance2p0;

pub async fn execute_seedance2pro_seedance2p0(
  _plan: &PlanSeedance2proSeedance2p0,
  _seedance2pro_client: &RouterSeedance2ProClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  todo!("execute_seedance2pro_seedance2p0")
}
