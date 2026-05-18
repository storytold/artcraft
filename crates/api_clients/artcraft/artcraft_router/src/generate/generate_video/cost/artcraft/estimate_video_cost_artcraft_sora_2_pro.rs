use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_sora_2_pro::PlanArtcraftSora2Pro;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_sora_2_pro(
  plan: &PlanArtcraftSora2Pro,
) -> VideoGenerationCostEstimate {
  // Sora 2 Pro: $0.30/second @ 720p, $0.50/second @ 1080p.
  // Default duration 4s. Default resolution: 1080p for text-to-video, 720p (Auto) for image-to-video.
  let seconds = plan.duration_seconds_for_cost();
  let per_second_cents: u64 = if plan.is_ten_eighty_p_for_cost() { 50 } else { 30 };
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
