use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_pro_1p1_ultra::PlanFalFluxPro11Ultra;

pub(crate) fn estimate_image_cost_fal_flux_pro_1p1_ultra(
  plan: &PlanFalFluxPro11Ultra<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.06 per image.
  let cost_per_image: u64 = 6;
  let num_images = plan.num_images.as_u64();
  let cost_in_usd_cents = cost_per_image * num_images;

  ImageGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}
