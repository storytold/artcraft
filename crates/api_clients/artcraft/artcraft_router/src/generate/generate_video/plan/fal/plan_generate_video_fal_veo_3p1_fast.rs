use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3p1::{
  build_plan_fal_veo_3p1, PlanFalVeo3p1,
};
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

/// Veo 3.1 Fast shares the exact same input shape as Veo 3.1 — only the
/// downstream Fal endpoint and pricing differ. We reuse the planner and tag the
/// resulting plan as the Fast variant for execute/cost dispatch.
#[derive(Debug, Clone)]
pub struct PlanFalVeo3p1Fast {
  pub inner: PlanFalVeo3p1,
}

pub fn plan_generate_video_fal_veo_3p1_fast<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let inner = build_plan_fal_veo_3p1(request, "Veo 3.1 Fast")?;
  Ok(VideoGenerationPlan::FalVeo3p1Fast(PlanFalVeo3p1Fast { inner }))
}
