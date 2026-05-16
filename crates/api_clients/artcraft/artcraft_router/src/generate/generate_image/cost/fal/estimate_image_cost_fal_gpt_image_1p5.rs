use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1p5::{
  FalGptImage1p5ImageSize, FalGptImage1p5Quality, PlanFalGptImage1p5,
};

pub(crate) fn estimate_image_cost_fal_gpt_image_1p5(
  plan: &PlanFalGptImage1p5,
) -> ImageGenerationCostEstimate {
  // Per fal docs (fal-ai/gpt-image-1.5 and fal-ai/gpt-image-1.5/edit):
  //
  //   Output image cost (per output image), rounded up to whole cents:
  //     Low:    $0.009 (1024×1024) / $0.013 (other)  →  1¢ / 2¢
  //     Medium: $0.034 (1024×1024) / $0.050 (1536×1024) / $0.051 (1024×1536)  →  4¢ / 5¢ / 6¢
  //     High:   $0.133 (1024×1024) / $0.199 (1536×1024) / $0.200 (1024×1536)  → 14¢ / 20¢ / 20¢
  //
  use FalGptImage1p5ImageSize as S;

  let cost_per_image: u64 = match (plan.quality, plan.image_size) {
    // Low quality
    (FalGptImage1p5Quality::Low, None | Some(S::Square)) => 1,
    (FalGptImage1p5Quality::Low, Some(S::Wide) | Some(S::Tall)) => 2,

    // Medium quality
    (FalGptImage1p5Quality::Medium, None | Some(S::Square)) => 4,
    (FalGptImage1p5Quality::Medium, Some(S::Wide)) => 5,
    (FalGptImage1p5Quality::Medium, Some(S::Tall)) => 6,

    // High quality
    (FalGptImage1p5Quality::High, None | Some(S::Square)) => 14,
    (FalGptImage1p5Quality::High, Some(S::Wide) | Some(S::Tall)) => 20,
  };
  let cost_in_usd_cents = cost_per_image * plan.num_images.as_u64();

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

#[cfg(test)]
mod tests {
  use super::*;
  use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1p5::FalGptImage1p5NumImages;

  fn plan(
    quality: FalGptImage1p5Quality,
    image_size: Option<FalGptImage1p5ImageSize>,
    num_images: FalGptImage1p5NumImages,
  ) -> PlanFalGptImage1p5 {
    PlanFalGptImage1p5 {
      prompt: Some("p".to_string()),
      image_urls: vec![],
      image_size,
      quality,
      num_images,
    }
  }

  fn cents(
    quality: FalGptImage1p5Quality,
    image_size: Option<FalGptImage1p5ImageSize>,
    num_images: FalGptImage1p5NumImages,
  ) -> u64 {
    estimate_image_cost_fal_gpt_image_1p5(&plan(quality, image_size, num_images))
      .cost_in_usd_cents.unwrap()
  }

  // ── Low quality (1¢ square, 2¢ wide/tall) ─────────────────────────────

  #[test]
  fn low_square() {
    assert_eq!(cents(FalGptImage1p5Quality::Low, Some(FalGptImage1p5ImageSize::Square), FalGptImage1p5NumImages::One), 1);
  }

  #[test]
  fn low_unset() {
    assert_eq!(cents(FalGptImage1p5Quality::Low, None, FalGptImage1p5NumImages::One), 1);
  }

  #[test]
  fn low_wide() {
    assert_eq!(cents(FalGptImage1p5Quality::Low, Some(FalGptImage1p5ImageSize::Wide), FalGptImage1p5NumImages::One), 2);
  }

  #[test]
  fn low_tall() {
    assert_eq!(cents(FalGptImage1p5Quality::Low, Some(FalGptImage1p5ImageSize::Tall), FalGptImage1p5NumImages::One), 2);
  }

  #[test]
  fn low_four() {
    assert_eq!(cents(FalGptImage1p5Quality::Low, None, FalGptImage1p5NumImages::Four), 4);
  }

  // ── Medium quality (4¢ square, 5¢ wide, 6¢ tall) ─────────────────────

  #[test]
  fn medium_square() {
    assert_eq!(cents(FalGptImage1p5Quality::Medium, Some(FalGptImage1p5ImageSize::Square), FalGptImage1p5NumImages::One), 4);
  }

  #[test]
  fn medium_unset() {
    assert_eq!(cents(FalGptImage1p5Quality::Medium, None, FalGptImage1p5NumImages::One), 4);
  }

  #[test]
  fn medium_wide() {
    assert_eq!(cents(FalGptImage1p5Quality::Medium, Some(FalGptImage1p5ImageSize::Wide), FalGptImage1p5NumImages::One), 5);
  }

  #[test]
  fn medium_tall() {
    assert_eq!(cents(FalGptImage1p5Quality::Medium, Some(FalGptImage1p5ImageSize::Tall), FalGptImage1p5NumImages::One), 6);
  }

  #[test]
  fn medium_square_four() {
    assert_eq!(cents(FalGptImage1p5Quality::Medium, Some(FalGptImage1p5ImageSize::Square), FalGptImage1p5NumImages::Four), 16);
  }

  #[test]
  fn medium_wide_four() {
    assert_eq!(cents(FalGptImage1p5Quality::Medium, Some(FalGptImage1p5ImageSize::Wide), FalGptImage1p5NumImages::Four), 20);
  }

  #[test]
  fn medium_tall_four() {
    assert_eq!(cents(FalGptImage1p5Quality::Medium, Some(FalGptImage1p5ImageSize::Tall), FalGptImage1p5NumImages::Four), 24);
  }

  // ── High quality (14¢ square, 20¢ wide/tall) ─────────────────────────

  #[test]
  fn high_square() {
    assert_eq!(cents(FalGptImage1p5Quality::High, Some(FalGptImage1p5ImageSize::Square), FalGptImage1p5NumImages::One), 14);
  }

  #[test]
  fn high_unset() {
    assert_eq!(cents(FalGptImage1p5Quality::High, None, FalGptImage1p5NumImages::One), 14);
  }

  #[test]
  fn high_wide() {
    assert_eq!(cents(FalGptImage1p5Quality::High, Some(FalGptImage1p5ImageSize::Wide), FalGptImage1p5NumImages::One), 20);
  }

  #[test]
  fn high_tall() {
    assert_eq!(cents(FalGptImage1p5Quality::High, Some(FalGptImage1p5ImageSize::Tall), FalGptImage1p5NumImages::One), 20);
  }

  #[test]
  fn high_square_four() {
    assert_eq!(cents(FalGptImage1p5Quality::High, Some(FalGptImage1p5ImageSize::Square), FalGptImage1p5NumImages::Four), 56);
  }

  #[test]
  fn high_wide_four() {
    assert_eq!(cents(FalGptImage1p5Quality::High, Some(FalGptImage1p5ImageSize::Wide), FalGptImage1p5NumImages::Four), 80);
  }

  // ── Metadata flags ────────────────────────────────────────────────────

  #[test]
  fn metadata_flags_are_default() {
    let estimate = estimate_image_cost_fal_gpt_image_1p5(&plan(
      FalGptImage1p5Quality::Medium, None, FalGptImage1p5NumImages::One,
    ));
    assert!(!estimate.is_free);
    assert!(!estimate.is_unlimited);
    assert!(!estimate.is_rate_limited);
    assert!(!estimate.has_watermark);
  }
}
