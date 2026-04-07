use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3_fast::PlanFalVeo3Fast;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_veo_3_fast(
  plan: &PlanFalVeo3Fast,
) -> VideoGenerationCostEstimate {
  // $0.10/sec audio off, $0.15/sec audio on (720p/1080p).
  let seconds = plan.duration_seconds_for_cost();
  let per_second_cents: u64 = if plan.generate_audio { 15 } else { 10 };
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
