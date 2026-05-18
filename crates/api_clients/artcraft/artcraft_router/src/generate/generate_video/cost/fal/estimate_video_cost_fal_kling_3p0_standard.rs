use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_3p0_standard::PlanFalKling3p0Standard;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_kling_3p0_standard(
  plan: &PlanFalKling3p0Standard,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client kling_3p0_standard:
  //   audio off: $0.168/sec  (rate=168)
  //   audio on:  $0.252/sec  (rate=252)
  let seconds = plan.duration_seconds_for_cost();
  let rate: u64 = if plan.generate_audio_for_cost() { 252 } else { 168 };
  let cost_in_usd_cents = (rate * seconds + 9) / 10;

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
