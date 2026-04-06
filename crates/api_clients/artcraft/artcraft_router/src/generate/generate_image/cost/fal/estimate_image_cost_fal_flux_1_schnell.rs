use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_flux_1_schnell::PlanFalFlux1Schnell;

pub(crate) fn estimate_image_cost_fal_flux_1_schnell(
  plan: &PlanFalFlux1Schnell<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.003 per megapixel, billed by rounding up to nearest megapixel.
  // Default image sizes are ~1MP (1024x1024), so ~$0.003/image = 1 cent rounded up.
  //
  // Fal docs:
  //   Your request will cost $0.003 per megapixel, with images billed by rounding up
  //   to the nearest megapixel.
  //
  let cost_per_image: u64 = 1;
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
