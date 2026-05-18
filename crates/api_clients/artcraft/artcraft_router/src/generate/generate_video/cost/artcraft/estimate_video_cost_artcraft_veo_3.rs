use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_3::PlanArtcraftVeo3;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_veo_3(
  plan: &PlanArtcraftVeo3,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client veo_3 cost calculator (720p/1080p):
  // $0.20/sec audio off, $0.40/sec audio on. Default 8s, audio off (legacy handler).
  let seconds = plan.duration_seconds_for_cost();
  let per_second_cents: u64 = if plan.generate_audio_for_cost() { 40 } else { 20 };
  let cost_in_usd_cents = per_second_cents * seconds;

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
