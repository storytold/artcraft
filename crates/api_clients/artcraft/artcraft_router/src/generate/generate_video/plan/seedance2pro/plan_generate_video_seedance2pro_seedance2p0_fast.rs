use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0::{
  PlanSeedance2proSeedance2p0, plan_generate_video_seedance2pro_seedance2p0,
};
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

/// Plan for Seedance 2.0 Fast via Seedance2Pro provider.
///
/// Uses the same plan structure as Seedance 2.0 Pro (same resolution, duration,
/// batch count, and media reference handling). The only difference is the model
/// type used at execution time.
pub fn plan_generate_video_seedance2pro_seedance2p0_fast<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  // Reuse the Pro plan builder — it produces a PlanSeedance2proSeedance2p0.
  // We wrap it in the Fast variant so execution dispatches to the Fast executor.
  let pro_plan = plan_generate_video_seedance2pro_seedance2p0(request)?;

  // Extract the inner plan struct and re-wrap it.
  match pro_plan {
    VideoGenerationPlan::Seedance2proSeedance2p0(plan) => {
      Ok(VideoGenerationPlan::Seedance2proSeedance2p0Fast(plan))
    }
    _ => unreachable!("plan_generate_video_seedance2pro_seedance2p0 always returns Seedance2proSeedance2p0"),
  }
}
