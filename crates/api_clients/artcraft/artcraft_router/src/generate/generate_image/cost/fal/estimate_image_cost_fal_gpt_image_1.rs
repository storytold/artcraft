use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1::{
  FalGptImage1ImageSize, FalGptImage1Quality, PlanFalGptImage1,
};

pub(crate) fn estimate_image_cost_fal_gpt_image_1(
  plan: &PlanFalGptImage1<'_>,
) -> ImageGenerationCostEstimate {
  // Per fal docs (fal-ai/gpt-image-1/{text-to-image,edit-image}):
  //   Low:    $0.011 (1024x1024) / $0.016 (other) per image
  //   Medium: $0.042 (1024x1024) / $0.063 (other) per image
  //   High:   $0.167 (1024x1024) / $0.250 (other) per image
  // Round up to whole cents.
  let is_square = matches!(plan.image_size, None | Some(FalGptImage1ImageSize::Square));
  let cost_per_image: u64 = match (plan.quality, is_square) {
    (FalGptImage1Quality::Low, true) => 2,
    (FalGptImage1Quality::Low, false) => 2,
    (FalGptImage1Quality::Medium, true) => 5,
    (FalGptImage1Quality::Medium, false) => 7,
    (FalGptImage1Quality::High, true) => 17,
    (FalGptImage1Quality::High, false) => 25,
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
