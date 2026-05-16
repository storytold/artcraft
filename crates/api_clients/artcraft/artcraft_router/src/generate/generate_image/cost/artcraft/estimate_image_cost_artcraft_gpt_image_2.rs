use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_2::{
  ArtcraftGptImage2ImageSize, ArtcraftGptImage2Quality, PlanArtcraftGptImage2,
};

pub(crate) fn estimate_image_cost_artcraft_gpt_image_2(
  plan: &PlanArtcraftGptImage2,
) -> ImageGenerationCostEstimate {
  // Same cost table as the Fal GPT Image 2 estimator.
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
  use ArtcraftGptImage2ImageSize as S;

  let cost_per_image: u64 = match (plan.quality, plan.image_size) {
    // Low quality
    (ArtcraftGptImage2Quality::Low, _) => 1,

    // Medium quality
    (ArtcraftGptImage2Quality::Medium, None | Some(S::Square) | Some(S::SquareHd)) => 6,
    (ArtcraftGptImage2Quality::Medium, Some(S::Landscape4x3) | Some(S::Portrait4x3)) => 4,
    (ArtcraftGptImage2Quality::Medium, Some(S::Landscape16x9) | Some(S::Portrait16x9)) => 4,
    (ArtcraftGptImage2Quality::Medium, Some(S::Auto)) => 6,

    // High quality
    (ArtcraftGptImage2Quality::High, None | Some(S::Square)) => 22,
    (ArtcraftGptImage2Quality::High, Some(S::SquareHd)) => 23,
    (ArtcraftGptImage2Quality::High, Some(S::Landscape4x3) | Some(S::Portrait4x3)) => 15,
    (ArtcraftGptImage2Quality::High, Some(S::Landscape16x9) | Some(S::Portrait16x9)) => 16,
    (ArtcraftGptImage2Quality::High, Some(S::Auto)) => 23,
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
  use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_2::ArtcraftGptImage2NumImages;

  fn plan(
    quality: ArtcraftGptImage2Quality,
    image_size: Option<ArtcraftGptImage2ImageSize>,
    num_images: ArtcraftGptImage2NumImages,
  ) -> PlanArtcraftGptImage2 {
    PlanArtcraftGptImage2 {
      prompt: Some("p".to_string()),
      image_inputs: None,
      image_size,
      quality,
      num_images,
      idempotency_token: "test".to_string(),
    }
  }

  fn cents(
    quality: ArtcraftGptImage2Quality,
    image_size: Option<ArtcraftGptImage2ImageSize>,
    num_images: ArtcraftGptImage2NumImages,
  ) -> u64 {
    estimate_image_cost_artcraft_gpt_image_2(&plan(quality, image_size, num_images))
      .cost_in_usd_cents.unwrap()
  }

  // -- Low quality (1c for all sizes) -------------------------------------------

  #[test]
  fn low_square() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Low, Some(ArtcraftGptImage2ImageSize::Square), ArtcraftGptImage2NumImages::One), 1);
  }

  #[test]
  fn low_square_hd() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Low, Some(ArtcraftGptImage2ImageSize::SquareHd), ArtcraftGptImage2NumImages::One), 1);
  }

  #[test]
  fn low_unset() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Low, None, ArtcraftGptImage2NumImages::One), 1);
  }

  #[test]
  fn low_landscape_4x3() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Low, Some(ArtcraftGptImage2ImageSize::Landscape4x3), ArtcraftGptImage2NumImages::One), 1);
  }

  #[test]
  fn low_four() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Low, None, ArtcraftGptImage2NumImages::Four), 4);
  }

  // -- Medium quality -----------------------------------------------------------

  #[test]
  fn medium_square() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Medium, Some(ArtcraftGptImage2ImageSize::Square), ArtcraftGptImage2NumImages::One), 6);
  }

  #[test]
  fn medium_square_hd() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Medium, Some(ArtcraftGptImage2ImageSize::SquareHd), ArtcraftGptImage2NumImages::One), 6);
  }

  #[test]
  fn medium_unset() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Medium, None, ArtcraftGptImage2NumImages::One), 6);
  }

  #[test]
  fn medium_landscape_4x3() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Medium, Some(ArtcraftGptImage2ImageSize::Landscape4x3), ArtcraftGptImage2NumImages::One), 4);
  }

  #[test]
  fn medium_portrait_4x3() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Medium, Some(ArtcraftGptImage2ImageSize::Portrait4x3), ArtcraftGptImage2NumImages::One), 4);
  }

  #[test]
  fn medium_landscape_16x9() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Medium, Some(ArtcraftGptImage2ImageSize::Landscape16x9), ArtcraftGptImage2NumImages::One), 4);
  }

  #[test]
  fn medium_portrait_16x9() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Medium, Some(ArtcraftGptImage2ImageSize::Portrait16x9), ArtcraftGptImage2NumImages::One), 4);
  }

  #[test]
  fn medium_square_four() {
    assert_eq!(cents(ArtcraftGptImage2Quality::Medium, Some(ArtcraftGptImage2ImageSize::Square), ArtcraftGptImage2NumImages::Four), 24);
  }

  // -- High quality -------------------------------------------------------------

  #[test]
  fn high_square() {
    assert_eq!(cents(ArtcraftGptImage2Quality::High, Some(ArtcraftGptImage2ImageSize::Square), ArtcraftGptImage2NumImages::One), 22);
  }

  #[test]
  fn high_square_hd() {
    assert_eq!(cents(ArtcraftGptImage2Quality::High, Some(ArtcraftGptImage2ImageSize::SquareHd), ArtcraftGptImage2NumImages::One), 23);
  }

  #[test]
  fn high_unset() {
    assert_eq!(cents(ArtcraftGptImage2Quality::High, None, ArtcraftGptImage2NumImages::One), 22);
  }

  #[test]
  fn high_landscape_4x3() {
    assert_eq!(cents(ArtcraftGptImage2Quality::High, Some(ArtcraftGptImage2ImageSize::Landscape4x3), ArtcraftGptImage2NumImages::One), 15);
  }

  #[test]
  fn high_portrait_4x3() {
    assert_eq!(cents(ArtcraftGptImage2Quality::High, Some(ArtcraftGptImage2ImageSize::Portrait4x3), ArtcraftGptImage2NumImages::One), 15);
  }

  #[test]
  fn high_landscape_16x9() {
    assert_eq!(cents(ArtcraftGptImage2Quality::High, Some(ArtcraftGptImage2ImageSize::Landscape16x9), ArtcraftGptImage2NumImages::One), 16);
  }

  #[test]
  fn high_portrait_16x9() {
    assert_eq!(cents(ArtcraftGptImage2Quality::High, Some(ArtcraftGptImage2ImageSize::Portrait16x9), ArtcraftGptImage2NumImages::One), 16);
  }

  #[test]
  fn high_square_four() {
    assert_eq!(cents(ArtcraftGptImage2Quality::High, Some(ArtcraftGptImage2ImageSize::Square), ArtcraftGptImage2NumImages::Four), 88);
  }

  #[test]
  fn high_square_hd_four() {
    assert_eq!(cents(ArtcraftGptImage2Quality::High, Some(ArtcraftGptImage2ImageSize::SquareHd), ArtcraftGptImage2NumImages::Four), 92);
  }

  // -- Metadata flags -----------------------------------------------------------

  #[test]
  fn metadata_flags_are_default() {
    let estimate = estimate_image_cost_artcraft_gpt_image_2(&plan(
      ArtcraftGptImage2Quality::Medium, None, ArtcraftGptImage2NumImages::One,
    ));
    assert!(!estimate.is_free);
    assert!(!estimate.is_unlimited);
    assert!(!estimate.is_rate_limited);
    assert!(!estimate.has_watermark);
  }
}
