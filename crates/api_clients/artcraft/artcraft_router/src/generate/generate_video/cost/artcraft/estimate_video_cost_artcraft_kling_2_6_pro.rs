use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling_2_6_pro::PlanArtcraftKling2p6Pro;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

pub(crate) fn estimate_video_cost_artcraft_kling_2_6_pro(
  plan: &PlanArtcraftKling2p6Pro,
) -> VideoGenerationCostEstimate {
  // Mirrors fal_client kling_v2p6_pro:
  //   audio off: $0.07/sec  → 5s=35¢, 10s=70¢
  //   audio on:  $0.14/sec  → 5s=70¢, 10s=140¢
  // Default duration is 5s; default generate_audio is true.
  let cost_in_usd_cents: u64 = match (plan.generate_audio_for_cost(), plan.is_ten_seconds()) {
    (false, false) => 35,
    (false, true) => 70,
    (true, false) => 70,
    (true, true) => 140,
  };

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
