use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_3p0_pro::PlanFalKling3p0Pro;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_fal_kling_3p0_pro(
  plan: &PlanFalKling3p0Pro,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client kling_3p0_pro:
  //   audio off: $0.224/sec  (rate=224 in tenths-of-cents)
  //   audio on:  $0.336/sec  (rate=336)
  // ceiling-divided to whole cents.
  let seconds = plan.duration_seconds_for_cost();
  let rate: u64 = if plan.generate_audio_for_cost() { 336 } else { 224 };
  let cost_in_usd_cents = (rate * seconds + 9) / 10;

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}
