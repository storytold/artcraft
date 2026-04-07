use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_1_master::PlanFalKling21Master;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_kling_2_1_master(
  plan: &PlanFalKling21Master,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client kling_v2p1_master: 5s = $1.40, 10s = $2.80.
  let cost_in_usd_cents: u64 = if plan.is_ten_seconds() { 280 } else { 140 };

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}
