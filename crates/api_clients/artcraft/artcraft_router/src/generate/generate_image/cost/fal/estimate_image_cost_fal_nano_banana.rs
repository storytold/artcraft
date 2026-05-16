use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana::{
  FalNbNumImages, PlanFalNanoBanana,
};

pub(crate) fn estimate_image_cost_fal_nano_banana(
  plan: &PlanFalNanoBanana,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.039/image (no resolution multiplier — Gemini 25 Flash has no resolution option).
  // Rounded to 4 cents per image.
  //
  // Fal docs:
  //   Your request will cost $0.039 per image. For $1.00, you can run this model 25 times.
  //
  let cost_per_image: u64 = 4;

  let num_images: u64 = match plan.num_images {
    FalNbNumImages::One => 1,
    FalNbNumImages::Two => 2,
    FalNbNumImages::Three => 3,
    FalNbNumImages::Four => 4,
  };

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
