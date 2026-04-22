use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_2::{
  FalGptImage2ImageSize, FalGptImage2Quality, PlanFalGptImage2,
};

pub(crate) fn estimate_image_cost_fal_gpt_image_2(
  plan: &PlanFalGptImage2,
) -> ImageGenerationCostEstimate {
  // Per fal docs (fal-ai/gpt-image-2 and fal-ai/gpt-image-2/edit):
  //
  //   Output image cost (per output image), rounded up to whole cents:
  //     Low:    all sizes                        →  1¢
  //     Medium: landscape_4_3/portrait_4_3       →  4¢
  //             landscape_16_9/portrait_16_9     →  4¢
  //             square                           →  6¢
  //             square_hd                        →  6¢
  //     High:   landscape_4_3/portrait_4_3       → 15¢
  //             landscape_16_9/portrait_16_9     → 16¢
  //             square                           → 22¢
  //             square_hd                        → 23¢
  //
  use FalGptImage2ImageSize as S;

  let cost_per_image: u64 = match (plan.quality, plan.image_size) {
    // Low quality
    (FalGptImage2Quality::Low, _) => 1,

    // Medium quality
    (FalGptImage2Quality::Medium, None | Some(S::Square) | Some(S::SquareHd)) => 6,
    (FalGptImage2Quality::Medium, Some(S::Landscape4x3) | Some(S::Portrait4x3)) => 4,
    (FalGptImage2Quality::Medium, Some(S::Landscape16x9) | Some(S::Portrait16x9)) => 4,
    (FalGptImage2Quality::Medium, Some(S::Auto)) => 6, // TODO: Not checked

    // High quality
    (FalGptImage2Quality::High, None | Some(S::Square)) => 22,
    (FalGptImage2Quality::High, Some(S::SquareHd)) => 23,
    (FalGptImage2Quality::High, Some(S::Landscape4x3) | Some(S::Portrait4x3)) => 15,
    (FalGptImage2Quality::High, Some(S::Landscape16x9) | Some(S::Portrait16x9)) => 16,
    (FalGptImage2Quality::High, Some(S::Auto)) => 23, // TODO: Not checked
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
  use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_2::FalGptImage2NumImages;

  fn plan(
    quality: FalGptImage2Quality,
    image_size: Option<FalGptImage2ImageSize>,
    num_images: FalGptImage2NumImages,
  ) -> PlanFalGptImage2 {
    PlanFalGptImage2 {
      prompt: Some("p".to_string()),
      image_urls: vec![],
      image_size,
      quality,
      num_images,
    }
  }

  fn cents(
    quality: FalGptImage2Quality,
    image_size: Option<FalGptImage2ImageSize>,
    num_images: FalGptImage2NumImages,
  ) -> u64 {
    estimate_image_cost_fal_gpt_image_2(&plan(quality, image_size, num_images))
      .cost_in_usd_cents.unwrap()
  }

  // -- Low quality (1c for all sizes) -------------------------------------------

  #[test]
  fn low_square() {
    assert_eq!(cents(FalGptImage2Quality::Low, Some(FalGptImage2ImageSize::Square), FalGptImage2NumImages::One), 1);
  }

  #[test]
  fn low_square_hd() {
    assert_eq!(cents(FalGptImage2Quality::Low, Some(FalGptImage2ImageSize::SquareHd), FalGptImage2NumImages::One), 1);
  }

  #[test]
  fn low_unset() {
    assert_eq!(cents(FalGptImage2Quality::Low, None, FalGptImage2NumImages::One), 1);
  }

  #[test]
  fn low_landscape_4x3() {
    assert_eq!(cents(FalGptImage2Quality::Low, Some(FalGptImage2ImageSize::Landscape4x3), FalGptImage2NumImages::One), 1);
  }

  #[test]
  fn low_four() {
    assert_eq!(cents(FalGptImage2Quality::Low, None, FalGptImage2NumImages::Four), 4);
  }

  // -- Medium quality -----------------------------------------------------------

  #[test]
  fn medium_square() {
    assert_eq!(cents(FalGptImage2Quality::Medium, Some(FalGptImage2ImageSize::Square), FalGptImage2NumImages::One), 6);
  }

  #[test]
  fn medium_square_hd() {
    assert_eq!(cents(FalGptImage2Quality::Medium, Some(FalGptImage2ImageSize::SquareHd), FalGptImage2NumImages::One), 6);
  }

  #[test]
  fn medium_unset() {
    assert_eq!(cents(FalGptImage2Quality::Medium, None, FalGptImage2NumImages::One), 6);
  }

  #[test]
  fn medium_landscape_4x3() {
    assert_eq!(cents(FalGptImage2Quality::Medium, Some(FalGptImage2ImageSize::Landscape4x3), FalGptImage2NumImages::One), 4);
  }

  #[test]
  fn medium_portrait_4x3() {
    assert_eq!(cents(FalGptImage2Quality::Medium, Some(FalGptImage2ImageSize::Portrait4x3), FalGptImage2NumImages::One), 4);
  }

  #[test]
  fn medium_landscape_16x9() {
    assert_eq!(cents(FalGptImage2Quality::Medium, Some(FalGptImage2ImageSize::Landscape16x9), FalGptImage2NumImages::One), 4);
  }

  #[test]
  fn medium_portrait_16x9() {
    assert_eq!(cents(FalGptImage2Quality::Medium, Some(FalGptImage2ImageSize::Portrait16x9), FalGptImage2NumImages::One), 4);
  }

  #[test]
  fn medium_square_four() {
    assert_eq!(cents(FalGptImage2Quality::Medium, Some(FalGptImage2ImageSize::Square), FalGptImage2NumImages::Four), 24);
  }

  // -- High quality -------------------------------------------------------------

  #[test]
  fn high_square() {
    assert_eq!(cents(FalGptImage2Quality::High, Some(FalGptImage2ImageSize::Square), FalGptImage2NumImages::One), 22);
  }

  #[test]
  fn high_square_hd() {
    assert_eq!(cents(FalGptImage2Quality::High, Some(FalGptImage2ImageSize::SquareHd), FalGptImage2NumImages::One), 23);
  }

  #[test]
  fn high_unset() {
    assert_eq!(cents(FalGptImage2Quality::High, None, FalGptImage2NumImages::One), 22);
  }

  #[test]
  fn high_landscape_4x3() {
    assert_eq!(cents(FalGptImage2Quality::High, Some(FalGptImage2ImageSize::Landscape4x3), FalGptImage2NumImages::One), 15);
  }

  #[test]
  fn high_portrait_4x3() {
    assert_eq!(cents(FalGptImage2Quality::High, Some(FalGptImage2ImageSize::Portrait4x3), FalGptImage2NumImages::One), 15);
  }

  #[test]
  fn high_landscape_16x9() {
    assert_eq!(cents(FalGptImage2Quality::High, Some(FalGptImage2ImageSize::Landscape16x9), FalGptImage2NumImages::One), 16);
  }

  #[test]
  fn high_portrait_16x9() {
    assert_eq!(cents(FalGptImage2Quality::High, Some(FalGptImage2ImageSize::Portrait16x9), FalGptImage2NumImages::One), 16);
  }

  #[test]
  fn high_square_four() {
    assert_eq!(cents(FalGptImage2Quality::High, Some(FalGptImage2ImageSize::Square), FalGptImage2NumImages::Four), 88);
  }

  #[test]
  fn high_square_hd_four() {
    assert_eq!(cents(FalGptImage2Quality::High, Some(FalGptImage2ImageSize::SquareHd), FalGptImage2NumImages::Four), 92);
  }

  // -- Metadata flags -----------------------------------------------------------

  #[test]
  fn metadata_flags_are_default() {
    let estimate = estimate_image_cost_fal_gpt_image_2(&plan(
      FalGptImage2Quality::Medium, None, FalGptImage2NumImages::One,
    ));
    assert!(!estimate.is_free);
    assert!(!estimate.is_unlimited);
    assert!(!estimate.is_rate_limited);
    assert!(!estimate.has_watermark);
  }
}
