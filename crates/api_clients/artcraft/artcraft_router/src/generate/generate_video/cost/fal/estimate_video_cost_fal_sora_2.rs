use crate::generate::generate_video::plan::fal::plan_generate_video_fal_sora_2::PlanFalSora2;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_sora_2(
  plan: &PlanFalSora2,
) -> VideoGenerationCostEstimate {
  // Sora 2: $0.10/second. Default duration (Fal client): 4s.
  let cost_in_usd_cents = plan.duration_seconds_for_cost() * 10;

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
