use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_pro_1p1::PlanFalFluxPro11;

pub(crate) fn estimate_image_cost_fal_flux_pro_1p1(
  plan: &PlanFalFluxPro11,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.04 per megapixel, billed by rounding up to nearest megapixel.
  // Default image sizes are ~1MP (1024x1024), so ~$0.04/image = 4 cents.
  let cost_per_image: u64 = 4;
  let num_images = plan.num_images.as_u64();
  let cost_in_usd_cents = cost_per_image * num_images;

  ImageGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
    failures_are_refunded: None,
  }
}
