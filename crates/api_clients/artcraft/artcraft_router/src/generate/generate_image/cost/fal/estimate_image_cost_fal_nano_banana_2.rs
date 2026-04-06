use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana_2::{
  FalNb2NumImages, FalNb2Resolution, PlanFalNanaBanana2,
};

pub(crate) fn estimate_image_cost_fal_nano_banana_2(
  plan: &PlanFalNanaBanana2<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.08/image at 0.5K, $0.15/image at 1K or 2K, $0.30/image at 4K.
  // (Stored as USD cents.)
  let cost_per_image: u64 = match plan.resolution {
    Some(FalNb2Resolution::HalfK) => 8,
    Some(FalNb2Resolution::FourK) => 30,
    _ => 15,
  };

  let num_images: u64 = match plan.num_images {
    FalNb2NumImages::One => 1,
    FalNb2NumImages::Two => 2,
    FalNb2NumImages::Three => 3,
    FalNb2NumImages::Four => 4,
  };

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
