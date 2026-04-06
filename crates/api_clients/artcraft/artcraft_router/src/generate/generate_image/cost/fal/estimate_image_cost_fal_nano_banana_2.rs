use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana_2::{
  FalNb2NumImages, FalNb2Resolution, PlanFalNanaBanana2,
};

pub(crate) fn estimate_image_cost_fal_nano_banana_2(
  plan: &PlanFalNanaBanana2<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.08/image base (1K). Multipliers: 0.5K = 0.75x, 2K = 1.5x, 4K = 2x.
  // (Stored as USD cents.)
  //
  // Fal docs:
  //   Your request will cost $0.08 per image. For $1.00, you can run this model 12 times.
  //   2K and 4K outputs will be charged at 1.5 times and 2 times the standard rate, respectively.
  //   0.5K (512px) resolution outputs will be charged at 0.75 times the standard rate. If web
  //   search is used, an additional $0.015 will be charged. If high thinking is used,
  //   an additional $0.002 will be charged. Note: Pricing is subject to change.
  //
  let cost_per_image: u64 = match plan.resolution {
    Some(FalNb2Resolution::HalfK) => 6,   // $0.06 = $0.08 * 0.75
    Some(FalNb2Resolution::OneK) => 8,     // $0.08 base
    Some(FalNb2Resolution::TwoK) => 12,    // $0.12 = $0.08 * 1.5
    Some(FalNb2Resolution::FourK) => 16,   // $0.16 = $0.08 * 2.0
    None => 8,                              // default = 1K base
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
