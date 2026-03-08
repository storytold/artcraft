use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_kling3p0_pro::estimate_video_cost_artcraft_kling3p0_pro;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_kling3p0_standard::estimate_video_cost_artcraft_kling3p0_standard;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_seedance1p5_pro::estimate_video_cost_artcraft_seedance1p5_pro;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_seedance2p0::estimate_video_cost_artcraft_seedance2p0;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_kling3p0_pro::execute_artcraft_kling3p0_pro;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_kling3p0_standard::execute_artcraft_kling3p0_standard;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_seedance1p5_pro::execute_artcraft_seedance1p5_pro;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_seedance2p0::execute_artcraft_seedance2p0;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling3p0_pro::PlanArtcraftKling3p0Pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling3p0_standard::PlanArtcraftKling3p0Standard;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance1p5_pro::PlanArtcraftSeedance1p5Pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

#[derive(Debug)]
pub enum VideoGenerationPlan<'a> {
  ArtcraftKling3p0Pro(PlanArtcraftKling3p0Pro<'a>),
  ArtcraftKling3p0Standard(PlanArtcraftKling3p0Standard<'a>),
  ArtcraftSeedance1p5Pro(PlanArtcraftSeedance1p5Pro<'a>),
  ArtcraftSeedance2p0(PlanArtcraftSeedance2p0<'a>),
}

impl<'a> VideoGenerationPlan<'a> {
  pub async fn generate_video(
    &self,
    client: &RouterClient,
  ) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match self {
      VideoGenerationPlan::ArtcraftKling3p0Pro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_kling3p0_pro(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftKling3p0Standard(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_kling3p0_standard(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftSeedance1p5Pro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedance1p5_pro(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftSeedance2p0(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedance2p0(plan, artcraft_client).await
      }
    }
  }

  pub fn estimate_costs(&self) -> VideoGenerationCostEstimate {
    match self {
      VideoGenerationPlan::ArtcraftKling3p0Pro(plan) => {
        estimate_video_cost_artcraft_kling3p0_pro(plan)
      }
      VideoGenerationPlan::ArtcraftKling3p0Standard(plan) => {
        estimate_video_cost_artcraft_kling3p0_standard(plan)
      }
      VideoGenerationPlan::ArtcraftSeedance1p5Pro(plan) => {
        estimate_video_cost_artcraft_seedance1p5_pro(plan)
      }
      VideoGenerationPlan::ArtcraftSeedance2p0(plan) => {
        estimate_video_cost_artcraft_seedance2p0(plan)
      }
    }
  }
}
