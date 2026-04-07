use crate::client::router_client::RouterClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_kling_1_6_pro::estimate_video_cost_artcraft_kling_1_6_pro;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_kling_2_1_master::estimate_video_cost_artcraft_kling_2_1_master;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_kling_2_1_pro::estimate_video_cost_artcraft_kling_2_1_pro;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_kling_2_5_turbo_pro::estimate_video_cost_artcraft_kling_2_5_turbo_pro;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_kling_2_6_pro::estimate_video_cost_artcraft_kling_2_6_pro;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_kling3p0_pro::estimate_video_cost_artcraft_kling3p0_pro;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_kling3p0_standard::estimate_video_cost_artcraft_kling3p0_standard;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_seedance_1_0_lite::estimate_video_cost_artcraft_seedance_1_0_lite;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_seedance1p5_pro::estimate_video_cost_artcraft_seedance1p5_pro;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_seedance2p0::estimate_video_cost_artcraft_seedance2p0;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_sora_2::estimate_video_cost_artcraft_sora_2;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_sora_2_pro::estimate_video_cost_artcraft_sora_2_pro;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_veo_2::estimate_video_cost_artcraft_veo_2;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_veo_3::estimate_video_cost_artcraft_veo_3;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_veo_3_fast::estimate_video_cost_artcraft_veo_3_fast;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_veo_3p1::estimate_video_cost_artcraft_veo_3p1;
use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_veo_3p1_fast::estimate_video_cost_artcraft_veo_3p1_fast;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_kling_1_6_pro::estimate_video_cost_fal_kling_1_6_pro;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_kling_2_1_master::estimate_video_cost_fal_kling_2_1_master;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_kling_2_1_pro::estimate_video_cost_fal_kling_2_1_pro;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_kling_2_5_turbo_pro::estimate_video_cost_fal_kling_2_5_turbo_pro;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_kling_2_6_pro::estimate_video_cost_fal_kling_2_6_pro;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_kling_3p0_pro::estimate_video_cost_fal_kling_3p0_pro;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_kling_3p0_standard::estimate_video_cost_fal_kling_3p0_standard;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_seedance_1_0_lite::estimate_video_cost_fal_seedance_1_0_lite;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_seedance_1p5_pro::estimate_video_cost_fal_seedance_1p5_pro;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_sora_2::estimate_video_cost_fal_sora_2;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_sora_2_pro::estimate_video_cost_fal_sora_2_pro;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_veo_2::estimate_video_cost_fal_veo_2;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_veo_3::estimate_video_cost_fal_veo_3;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_veo_3_fast::estimate_video_cost_fal_veo_3_fast;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_veo_3p1::estimate_video_cost_fal_veo_3p1;
use crate::generate::generate_video::cost::fal::estimate_video_cost_fal_veo_3p1_fast::estimate_video_cost_fal_veo_3p1_fast;
use crate::generate::generate_video::cost::muapi::estimate_video_cost_muapi_seedance2p0::estimate_video_cost_muapi_seedance2p0;
use crate::generate::generate_video::cost::seedance2pro::estimate_video_cost_seedance2pro_seedance2p0::estimate_video_cost_seedance2pro_seedance2p0;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_kling_1_6_pro::execute_artcraft_kling_1_6_pro;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_kling_2_1_master::execute_artcraft_kling_2_1_master;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_kling_2_1_pro::execute_artcraft_kling_2_1_pro;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_kling_2_5_turbo_pro::execute_artcraft_kling_2_5_turbo_pro;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_kling_2_6_pro::execute_artcraft_kling_2_6_pro;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_kling3p0_pro::execute_artcraft_kling3p0_pro;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_kling3p0_standard::execute_artcraft_kling3p0_standard;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_seedance_1_0_lite::execute_artcraft_seedance_1_0_lite;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_seedance1p5_pro::execute_artcraft_seedance1p5_pro;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_seedance2p0::execute_artcraft_seedance2p0;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_sora_2::execute_artcraft_sora_2;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_sora_2_pro::execute_artcraft_sora_2_pro;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_veo_2::execute_artcraft_veo_2;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_veo_3::execute_artcraft_veo_3;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_veo_3_fast::execute_artcraft_veo_3_fast;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_veo_3p1::execute_artcraft_veo_3p1;
use crate::generate::generate_video::execute::artcraft::generate_video_artcraft_veo_3p1_fast::execute_artcraft_veo_3p1_fast;
use crate::generate::generate_video::execute::fal::generate_video_fal_kling_1_6_pro::execute_fal_kling_1_6_pro;
use crate::generate::generate_video::execute::fal::generate_video_fal_kling_2_1_master::execute_fal_kling_2_1_master;
use crate::generate::generate_video::execute::fal::generate_video_fal_kling_2_1_pro::execute_fal_kling_2_1_pro;
use crate::generate::generate_video::execute::fal::generate_video_fal_kling_2_5_turbo_pro::execute_fal_kling_2_5_turbo_pro;
use crate::generate::generate_video::execute::fal::generate_video_fal_kling_2_6_pro::execute_fal_kling_2_6_pro;
use crate::generate::generate_video::execute::fal::generate_video_fal_kling_3p0_pro::execute_fal_kling_3p0_pro;
use crate::generate::generate_video::execute::fal::generate_video_fal_kling_3p0_standard::execute_fal_kling_3p0_standard;
use crate::generate::generate_video::execute::fal::generate_video_fal_seedance_1_0_lite::execute_fal_seedance_1_0_lite;
use crate::generate::generate_video::execute::fal::generate_video_fal_seedance_1p5_pro::execute_fal_seedance_1p5_pro;
use crate::generate::generate_video::execute::fal::generate_video_fal_sora_2::execute_fal_sora_2;
use crate::generate::generate_video::execute::fal::generate_video_fal_sora_2_pro::execute_fal_sora_2_pro;
use crate::generate::generate_video::execute::fal::generate_video_fal_veo_2::execute_fal_veo_2;
use crate::generate::generate_video::execute::fal::generate_video_fal_veo_3::execute_fal_veo_3;
use crate::generate::generate_video::execute::fal::generate_video_fal_veo_3_fast::execute_fal_veo_3_fast;
use crate::generate::generate_video::execute::fal::generate_video_fal_veo_3p1::execute_fal_veo_3p1;
use crate::generate::generate_video::execute::fal::generate_video_fal_veo_3p1_fast::execute_fal_veo_3p1_fast;
use crate::generate::generate_video::execute::muapi::execute_muapi_seedance2p0::execute_muapi_seedance2p0;
use crate::generate::generate_video::execute::seedance2pro::execute_seedance2pro_seedance2p0::execute_seedance2pro_seedance2p0;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling_1_6_pro::PlanArtcraftKling16Pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling_2_1_master::PlanArtcraftKling21Master;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling_2_1_pro::PlanArtcraftKling21Pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling_2_5_turbo_pro::PlanArtcraftKling2p5TurboPro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling_2_6_pro::PlanArtcraftKling2p6Pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling3p0_pro::PlanArtcraftKling3p0Pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling3p0_standard::PlanArtcraftKling3p0Standard;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance_1_0_lite::PlanArtcraftSeedance10Lite;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance1p5_pro::PlanArtcraftSeedance1p5Pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_sora_2::PlanArtcraftSora2;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_sora_2_pro::PlanArtcraftSora2Pro;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_2::PlanArtcraftVeo2;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_3::PlanArtcraftVeo3;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_3_fast::PlanArtcraftVeo3Fast;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_3p1::PlanArtcraftVeo3p1;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_3p1_fast::PlanArtcraftVeo3p1Fast;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::PlanFalKling16Pro;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_1_master::PlanFalKling21Master;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_1_pro::PlanFalKling21Pro;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_5_turbo_pro::PlanFalKling2p5TurboPro;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_6_pro::PlanFalKling2p6Pro;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_3p0_pro::PlanFalKling3p0Pro;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_3p0_standard::PlanFalKling3p0Standard;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_seedance_1_0_lite::PlanFalSeedance10Lite;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_seedance_1p5_pro::PlanFalSeedance1p5Pro;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_sora_2::PlanFalSora2;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_sora_2_pro::PlanFalSora2Pro;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_2::PlanFalVeo2;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3::PlanFalVeo3;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3_fast::PlanFalVeo3Fast;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3p1::PlanFalVeo3p1;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3p1_fast::PlanFalVeo3p1Fast;
use crate::generate::generate_video::plan::muapi::plan_generate_video_muapi_seedance2p0::PlanMuapiSeedance2p0;
use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0::PlanSeedance2proSeedance2p0;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

#[derive(Debug)]
pub enum VideoGenerationPlan<'a> {
  ArtcraftKling16Pro(PlanArtcraftKling16Pro<'a>),
  ArtcraftKling21Master(PlanArtcraftKling21Master<'a>),
  ArtcraftKling21Pro(PlanArtcraftKling21Pro<'a>),
  ArtcraftKling2p5TurboPro(PlanArtcraftKling2p5TurboPro<'a>),
  ArtcraftKling2p6Pro(PlanArtcraftKling2p6Pro<'a>),
  ArtcraftKling3p0Pro(PlanArtcraftKling3p0Pro<'a>),
  ArtcraftKling3p0Standard(PlanArtcraftKling3p0Standard<'a>),
  ArtcraftSeedance10Lite(PlanArtcraftSeedance10Lite<'a>),
  ArtcraftSeedance1p5Pro(PlanArtcraftSeedance1p5Pro<'a>),
  ArtcraftSeedance2p0(PlanArtcraftSeedance2p0<'a>),
  ArtcraftSora2(PlanArtcraftSora2<'a>),
  ArtcraftSora2Pro(PlanArtcraftSora2Pro<'a>),
  ArtcraftVeo2(PlanArtcraftVeo2<'a>),
  ArtcraftVeo3(PlanArtcraftVeo3<'a>),
  ArtcraftVeo3Fast(PlanArtcraftVeo3Fast<'a>),
  ArtcraftVeo3p1(PlanArtcraftVeo3p1<'a>),
  ArtcraftVeo3p1Fast(PlanArtcraftVeo3p1Fast<'a>),
  MuapiSeedance2p0(PlanMuapiSeedance2p0),
  Seedance2proSeedance2p0(PlanSeedance2proSeedance2p0),
  FalVeo2(PlanFalVeo2),
  FalVeo3(PlanFalVeo3),
  FalVeo3Fast(PlanFalVeo3Fast),
  FalVeo3p1(PlanFalVeo3p1),
  FalVeo3p1Fast(PlanFalVeo3p1Fast),
  FalKling16Pro(PlanFalKling16Pro),
  FalKling21Pro(PlanFalKling21Pro),
  FalKling21Master(PlanFalKling21Master),
  FalKling2p5TurboPro(PlanFalKling2p5TurboPro),
  FalKling2p6Pro(PlanFalKling2p6Pro),
  FalKling3p0Pro(PlanFalKling3p0Pro),
  FalKling3p0Standard(PlanFalKling3p0Standard),
  FalSeedance10Lite(PlanFalSeedance10Lite),
  FalSeedance1p5Pro(PlanFalSeedance1p5Pro),
  FalSora2(PlanFalSora2),
  FalSora2Pro(PlanFalSora2Pro),
}

impl<'a> VideoGenerationPlan<'a> {
  pub async fn generate_video(
    &self,
    client: &RouterClient,
  ) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match self {
      VideoGenerationPlan::ArtcraftKling16Pro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_kling_1_6_pro(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftKling21Master(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_kling_2_1_master(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftKling21Pro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_kling_2_1_pro(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftKling2p5TurboPro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_kling_2_5_turbo_pro(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftKling2p6Pro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_kling_2_6_pro(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftKling3p0Pro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_kling3p0_pro(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftKling3p0Standard(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_kling3p0_standard(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftSeedance10Lite(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedance_1_0_lite(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftSeedance1p5Pro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedance1p5_pro(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftSeedance2p0(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_seedance2p0(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftSora2(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_sora_2(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftSora2Pro(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_sora_2_pro(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftVeo2(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_veo_2(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftVeo3(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_veo_3(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftVeo3Fast(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_veo_3_fast(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftVeo3p1(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_veo_3p1(plan, artcraft_client).await
      }
      VideoGenerationPlan::ArtcraftVeo3p1Fast(plan) => {
        let artcraft_client = client.get_artcraft_client_ref()?;
        execute_artcraft_veo_3p1_fast(plan, artcraft_client).await
      }
      VideoGenerationPlan::MuapiSeedance2p0(plan) => {
        let muapi_client = client.get_muapi_client_ref()?;
        execute_muapi_seedance2p0(plan, muapi_client).await
      }
      VideoGenerationPlan::Seedance2proSeedance2p0(plan) => {
        let seedance2pro_client = client.get_seedance2pro_client_ref()?;
        execute_seedance2pro_seedance2p0(plan, seedance2pro_client).await
      }
      VideoGenerationPlan::FalVeo2(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_veo_2(plan, fal_client).await
      }
      VideoGenerationPlan::FalVeo3(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_veo_3(plan, fal_client).await
      }
      VideoGenerationPlan::FalVeo3Fast(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_veo_3_fast(plan, fal_client).await
      }
      VideoGenerationPlan::FalVeo3p1(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_veo_3p1(plan, fal_client).await
      }
      VideoGenerationPlan::FalVeo3p1Fast(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_veo_3p1_fast(plan, fal_client).await
      }
      VideoGenerationPlan::FalKling16Pro(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_kling_1_6_pro(plan, fal_client).await
      }
      VideoGenerationPlan::FalKling21Pro(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_kling_2_1_pro(plan, fal_client).await
      }
      VideoGenerationPlan::FalKling21Master(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_kling_2_1_master(plan, fal_client).await
      }
      VideoGenerationPlan::FalKling2p5TurboPro(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_kling_2_5_turbo_pro(plan, fal_client).await
      }
      VideoGenerationPlan::FalKling2p6Pro(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_kling_2_6_pro(plan, fal_client).await
      }
      VideoGenerationPlan::FalKling3p0Pro(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_kling_3p0_pro(plan, fal_client).await
      }
      VideoGenerationPlan::FalKling3p0Standard(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_kling_3p0_standard(plan, fal_client).await
      }
      VideoGenerationPlan::FalSeedance10Lite(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_seedance_1_0_lite(plan, fal_client).await
      }
      VideoGenerationPlan::FalSeedance1p5Pro(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_seedance_1p5_pro(plan, fal_client).await
      }
      VideoGenerationPlan::FalSora2(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_sora_2(plan, fal_client).await
      }
      VideoGenerationPlan::FalSora2Pro(plan) => {
        let fal_client = client.get_fal_client_ref()?;
        execute_fal_sora_2_pro(plan, fal_client).await
      }
    }
  }

  pub fn estimate_costs(&self) -> VideoGenerationCostEstimate {
    match self {
      VideoGenerationPlan::ArtcraftKling16Pro(plan) => estimate_video_cost_artcraft_kling_1_6_pro(plan),
      VideoGenerationPlan::ArtcraftKling21Master(plan) => estimate_video_cost_artcraft_kling_2_1_master(plan),
      VideoGenerationPlan::ArtcraftKling21Pro(plan) => estimate_video_cost_artcraft_kling_2_1_pro(plan),
      VideoGenerationPlan::ArtcraftKling2p5TurboPro(plan) => estimate_video_cost_artcraft_kling_2_5_turbo_pro(plan),
      VideoGenerationPlan::ArtcraftKling2p6Pro(plan) => estimate_video_cost_artcraft_kling_2_6_pro(plan),
      VideoGenerationPlan::ArtcraftKling3p0Pro(plan) => {
        estimate_video_cost_artcraft_kling3p0_pro(plan)
      }
      VideoGenerationPlan::ArtcraftKling3p0Standard(plan) => {
        estimate_video_cost_artcraft_kling3p0_standard(plan)
      }
      VideoGenerationPlan::ArtcraftSeedance10Lite(plan) => {
        estimate_video_cost_artcraft_seedance_1_0_lite(plan)
      }
      VideoGenerationPlan::ArtcraftSeedance1p5Pro(plan) => {
        estimate_video_cost_artcraft_seedance1p5_pro(plan)
      }
      VideoGenerationPlan::ArtcraftSeedance2p0(plan) => {
        estimate_video_cost_artcraft_seedance2p0(plan)
      }
      VideoGenerationPlan::ArtcraftSora2(plan) => {
        estimate_video_cost_artcraft_sora_2(plan)
      }
      VideoGenerationPlan::ArtcraftSora2Pro(plan) => {
        estimate_video_cost_artcraft_sora_2_pro(plan)
      }
      VideoGenerationPlan::ArtcraftVeo2(plan) => estimate_video_cost_artcraft_veo_2(plan),
      VideoGenerationPlan::ArtcraftVeo3(plan) => estimate_video_cost_artcraft_veo_3(plan),
      VideoGenerationPlan::ArtcraftVeo3Fast(plan) => estimate_video_cost_artcraft_veo_3_fast(plan),
      VideoGenerationPlan::ArtcraftVeo3p1(plan) => estimate_video_cost_artcraft_veo_3p1(plan),
      VideoGenerationPlan::ArtcraftVeo3p1Fast(plan) => estimate_video_cost_artcraft_veo_3p1_fast(plan),
      VideoGenerationPlan::MuapiSeedance2p0(plan) => {
        estimate_video_cost_muapi_seedance2p0(plan)
      }
      VideoGenerationPlan::Seedance2proSeedance2p0(plan) => {
        estimate_video_cost_seedance2pro_seedance2p0(plan)
      }
      VideoGenerationPlan::FalVeo2(plan) => estimate_video_cost_fal_veo_2(plan),
      VideoGenerationPlan::FalVeo3(plan) => estimate_video_cost_fal_veo_3(plan),
      VideoGenerationPlan::FalVeo3Fast(plan) => estimate_video_cost_fal_veo_3_fast(plan),
      VideoGenerationPlan::FalVeo3p1(plan) => estimate_video_cost_fal_veo_3p1(plan),
      VideoGenerationPlan::FalVeo3p1Fast(plan) => estimate_video_cost_fal_veo_3p1_fast(plan),
      VideoGenerationPlan::FalKling16Pro(plan) => estimate_video_cost_fal_kling_1_6_pro(plan),
      VideoGenerationPlan::FalKling21Pro(plan) => estimate_video_cost_fal_kling_2_1_pro(plan),
      VideoGenerationPlan::FalKling21Master(plan) => estimate_video_cost_fal_kling_2_1_master(plan),
      VideoGenerationPlan::FalKling2p5TurboPro(plan) => estimate_video_cost_fal_kling_2_5_turbo_pro(plan),
      VideoGenerationPlan::FalKling2p6Pro(plan) => estimate_video_cost_fal_kling_2_6_pro(plan),
      VideoGenerationPlan::FalKling3p0Pro(plan) => estimate_video_cost_fal_kling_3p0_pro(plan),
      VideoGenerationPlan::FalKling3p0Standard(plan) => estimate_video_cost_fal_kling_3p0_standard(plan),
      VideoGenerationPlan::FalSeedance10Lite(plan) => estimate_video_cost_fal_seedance_1_0_lite(plan),
      VideoGenerationPlan::FalSeedance1p5Pro(plan) => estimate_video_cost_fal_seedance_1p5_pro(plan),
      VideoGenerationPlan::FalSora2(plan) => estimate_video_cost_fal_sora_2(plan),
      VideoGenerationPlan::FalSora2Pro(plan) => estimate_video_cost_fal_sora_2_pro(plan),
    }
  }
}
