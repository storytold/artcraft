use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_3p0_pro::{
  build_kling_3p0_plan, FalKling3p0AspectRatio, FalKling3p0Duration, FalKling3p0Mode,
};
use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;

#[derive(Debug, Clone)]
pub struct PlanFalKling3p0Standard {
  pub prompt: String,
  pub negative_prompt: Option<String>,
  pub mode: FalKling3p0Mode,
  pub aspect_ratio: Option<FalKling3p0AspectRatio>,
  pub duration: Option<FalKling3p0Duration>,
  pub generate_audio: Option<bool>,
}

pub fn plan_generate_video_fal_kling_3p0_standard<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<VideoGenerationPlan<'a>, ArtcraftRouterError> {
  let inner = build_kling_3p0_plan(request, "Kling 3.0 Standard")?;
  Ok(VideoGenerationPlan::FalKling3p0Standard(PlanFalKling3p0Standard {
    prompt: inner.prompt,
    negative_prompt: inner.negative_prompt,
    mode: inner.mode,
    aspect_ratio: inner.aspect_ratio,
    duration: inner.duration,
    generate_audio: inner.generate_audio,
  }))
}

impl PlanFalKling3p0Standard {
  pub fn duration_seconds_for_cost(&self) -> u64 {
    self.duration.map(|d| d.0 as u64).unwrap_or(5)
  }

  pub fn generate_audio_for_cost(&self) -> bool {
    self.generate_audio.unwrap_or(true)
  }
}
