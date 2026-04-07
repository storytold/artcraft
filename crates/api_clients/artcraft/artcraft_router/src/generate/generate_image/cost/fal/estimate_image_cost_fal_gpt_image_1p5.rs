use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1p5::{
  FalGptImage1p5ImageSize, FalGptImage1p5Quality, PlanFalGptImage1p5,
};

pub(crate) fn estimate_image_cost_fal_gpt_image_1p5(
  plan: &PlanFalGptImage1p5<'_>,
) -> ImageGenerationCostEstimate {
  // Per fal docs:
  //   Low:    $0.009 (1024x1024) / $0.013 (other)
  //   Medium: $0.034 (1024x1024) / $0.050–0.051 (other)
  //   High:   $0.133 (1024x1024) / $0.199–0.200 (other)
  // Round up to whole cents.
  let is_square = matches!(plan.image_size, None | Some(FalGptImage1p5ImageSize::Square));
  let cost_per_image: u64 = match (plan.quality, is_square) {
    (FalGptImage1p5Quality::Low, true) => 1,
    (FalGptImage1p5Quality::Low, false) => 2,
    (FalGptImage1p5Quality::Medium, true) => 4,
    (FalGptImage1p5Quality::Medium, false) => 6,
    (FalGptImage1p5Quality::High, true) => 14,
    (FalGptImage1p5Quality::High, false) => 20,
  };
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
