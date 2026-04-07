use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_3_fast::PlanArtcraftVeo3Fast;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_veo_3_fast(
  plan: &PlanArtcraftVeo3Fast<'_>,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client veo_3_fast cost calculator (720p/1080p):
  // $0.10/sec audio off, $0.15/sec audio on. Default 8s, audio off (legacy handler).
  let seconds = plan.duration_seconds_for_cost();
  let per_second_cents: u64 = if plan.generate_audio_for_cost() { 15 } else { 10 };
  let cost_in_usd_cents = per_second_cents * seconds;

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}
