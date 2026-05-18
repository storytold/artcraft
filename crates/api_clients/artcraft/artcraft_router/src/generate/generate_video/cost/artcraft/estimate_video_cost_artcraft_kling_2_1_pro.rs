use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling_2_1_pro::PlanArtcraftKling21Pro;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_kling_2_1_pro(
  plan: &PlanArtcraftKling21Pro,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client kling_v2p1_pro: 5s = $0.45, 10s = $0.90.
  let cost_in_usd_cents: u64 = if plan.is_ten_seconds() { 90 } else { 45 };

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
    failures_are_refunded: None,
  }
}
