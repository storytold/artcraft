use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_1_6_pro::PlanFalKling16Pro;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_kling_1_6_pro(
  plan: &PlanFalKling16Pro,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client kling_v1p6_pro: 5s = 48¢, 10s = 95¢ (Default → 5s).
  let cost_in_usd_cents: u64 = if plan.is_ten_seconds() { 95 } else { 48 };

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}
