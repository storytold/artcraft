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

#[cfg(test)]
mod tests {
  use super::*;
  use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1::FalGptImage1NumImages;

  fn plan(
    quality: FalGptImage1Quality,
    image_size: Option<FalGptImage1ImageSize>,
    num_images: FalGptImage1NumImages,
  ) -> PlanFalGptImage1<'static> {
    PlanFalGptImage1 {
      prompt: Some("p"),
      image_urls: vec![],
      image_size,
      quality,
      num_images,
    }
  }

  fn cents(
    quality: FalGptImage1Quality,
    image_size: Option<FalGptImage1ImageSize>,
    num_images: FalGptImage1NumImages,
  ) -> u64 {
    estimate_image_cost_fal_gpt_image_1(&plan(quality, image_size, num_images))
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  // ── Low quality (2¢/image, both square and non-square) ────────────────────

  #[test]
  fn low_square_one_image_costs_2_cents() {
    assert_eq!(cents(FalGptImage1Quality::Low, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One), 2);
  }

  #[test]
  fn low_horizontal_one_image_costs_2_cents() {
    assert_eq!(cents(FalGptImage1Quality::Low, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::One), 2);
  }

  #[test]
  fn low_vertical_one_image_costs_2_cents() {
    assert_eq!(cents(FalGptImage1Quality::Low, Some(FalGptImage1ImageSize::Vertical), FalGptImage1NumImages::One), 2);
  }

  #[test]
  fn low_unset_size_costs_2_cents() {
    // Unset image_size is treated as square in pricing.
    assert_eq!(cents(FalGptImage1Quality::Low, None, FalGptImage1NumImages::One), 2);
  }

  #[test]
  fn low_four_images_costs_8_cents() {
    assert_eq!(cents(FalGptImage1Quality::Low, None, FalGptImage1NumImages::Four), 8);
  }

  // ── Medium quality (5¢ square, 7¢ wide/tall) ──────────────────────────────

  #[test]
  fn medium_square_one_image_costs_5_cents() {
    assert_eq!(cents(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One), 5);
  }

  #[test]
  fn medium_horizontal_one_image_costs_7_cents() {
    assert_eq!(cents(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::One), 7);
  }

  #[test]
  fn medium_vertical_one_image_costs_7_cents() {
    assert_eq!(cents(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Vertical), FalGptImage1NumImages::One), 7);
  }

  #[test]
  fn medium_unset_size_costs_5_cents() {
    assert_eq!(cents(FalGptImage1Quality::Medium, None, FalGptImage1NumImages::One), 5);
  }

  #[test]
  fn medium_square_four_images_costs_20_cents() {
    assert_eq!(cents(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::Four), 20);
  }

  #[test]
  fn medium_horizontal_four_images_costs_28_cents() {
    assert_eq!(cents(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::Four), 28);
  }

  // ── High quality (17¢ square, 25¢ wide/tall) ──────────────────────────────

  #[test]
  fn high_square_one_image_costs_17_cents() {
    assert_eq!(cents(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One), 17);
  }

  #[test]
  fn high_horizontal_one_image_costs_25_cents() {
    assert_eq!(cents(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::One), 25);
  }

  #[test]
  fn high_vertical_one_image_costs_25_cents() {
    assert_eq!(cents(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Vertical), FalGptImage1NumImages::One), 25);
  }

  #[test]
  fn high_unset_size_costs_17_cents() {
    assert_eq!(cents(FalGptImage1Quality::High, None, FalGptImage1NumImages::One), 17);
  }

  #[test]
  fn high_square_two_images_costs_34_cents() {
    assert_eq!(cents(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::Two), 34);
  }

  #[test]
  fn high_horizontal_four_images_costs_100_cents() {
    assert_eq!(cents(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::Four), 100);
  }

  // ── Metadata flags ────────────────────────────────────────────────────────

  #[test]
  fn metadata_flags_are_default() {
    let estimate = estimate_image_cost_fal_gpt_image_1(&plan(
      FalGptImage1Quality::Medium,
      None,
      FalGptImage1NumImages::One,
    ));
    assert!(!estimate.is_free);
    assert!(!estimate.is_unlimited);
    assert!(!estimate.is_rate_limited);
    assert!(!estimate.has_watermark);
  }
}
