use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_5_turbo_pro::PlanFalKling2p5TurboPro;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_kling_2_5_turbo_pro(
  plan: &PlanFalKling2p5TurboPro,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client kling_v2p5_turbo_pro: 5s = 35¢, 10s = 70¢. None → 5s.
  let cost_in_usd_cents: u64 = if plan.is_ten_seconds() { 70 } else { 35 };

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}
