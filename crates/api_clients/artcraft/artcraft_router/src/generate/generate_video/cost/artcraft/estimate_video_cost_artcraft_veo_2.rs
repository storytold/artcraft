use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_2::PlanArtcraftVeo2;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_veo_2(
  plan: &PlanArtcraftVeo2<'_>,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client veo_2 cost calculator: 5s = $2.50, +$0.50/s above 5s.
  let seconds = plan.duration_seconds_for_cost();
  let extra = seconds.saturating_sub(5);
  let cost_in_usd_cents = 250 + extra * 50;

  VideoGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}
