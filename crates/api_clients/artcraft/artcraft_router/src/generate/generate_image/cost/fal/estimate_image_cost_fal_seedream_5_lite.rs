use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_seedream_5_lite::PlanFalSeedream5Lite;

pub(crate) fn estimate_image_cost_fal_seedream_5_lite(
  plan: &PlanFalSeedream5Lite<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.035 per image — round up to 4 cents.
  let cost_per_image: u64 = 4;
  let cost_in_usd_cents = cost_per_image * plan.num_images.as_u64();

  ImageGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}
