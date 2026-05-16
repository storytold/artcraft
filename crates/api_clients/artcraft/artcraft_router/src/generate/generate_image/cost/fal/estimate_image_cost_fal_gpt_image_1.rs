use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1::{
  FalGptImage1ImageSize, FalGptImage1Quality, PlanFalGptImage1,
};

pub(crate) fn estimate_image_cost_fal_gpt_image_1(
  plan: &PlanFalGptImage1,
) -> ImageGenerationCostEstimate {
  // Per fal docs (fal-ai/gpt-image-1/{text-to-image,edit-image}):
  //
  //   Output image cost (per output image):
  //     Low:    $0.011 (1024×1024) / $0.016 (other) →  2¢ / 2¢
  //     Medium: $0.042 (1024×1024) / $0.063 (other) →  5¢ / 7¢
  //     High:   $0.167 (1024×1024) / $0.250 (other) → 17¢ / 25¢
  //
  //   Input image tokens (edit mode, per input image, high-fidelity assumed):
  //     3,050 tokens × $0.005/1K tokens ≈ $0.01525 → 2¢ per input image
  //
  //   Input text tokens: free (we don't charge for these).
  //
  let is_square = matches!(plan.image_size, None | Some(FalGptImage1ImageSize::Square));
  let output_cost_per_image: u64 = match (plan.quality, is_square) {
    (FalGptImage1Quality::Low, true) => 2,
    (FalGptImage1Quality::Low, false) => 2,
    (FalGptImage1Quality::Medium, true) => 5,
    (FalGptImage1Quality::Medium, false) => 7,
    (FalGptImage1Quality::High, true) => 17,
    (FalGptImage1Quality::High, false) => 25,
  };

  let num_output_images = plan.num_images.as_u64();
  let output_cost = output_cost_per_image * num_output_images;

  // Input image token cost: 2¢ per input image (high-fidelity estimate).
  let input_image_cost: u64 = if plan.image_urls.is_empty() {
    0
  } else {
    2 * plan.image_urls.len() as u64
  };

  let cost_in_usd_cents = output_cost + input_image_cost;

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
  use crate::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1::FalGptImage1NumImages;

  fn text_plan(
    quality: FalGptImage1Quality,
    image_size: Option<FalGptImage1ImageSize>,
    num_images: FalGptImage1NumImages,
  ) -> PlanFalGptImage1 {
    PlanFalGptImage1 {
      prompt: Some("p".to_string()),
      image_urls: vec![],
      image_size,
      quality,
      num_images,
    }
  }

  fn edit_plan(
    quality: FalGptImage1Quality,
    image_size: Option<FalGptImage1ImageSize>,
    num_images: FalGptImage1NumImages,
    num_input_images: usize,
  ) -> PlanFalGptImage1 {
    let image_urls = (0..num_input_images)
      .map(|i| format!("https://fake.example.com/img{}.png", i))
      .collect();
    PlanFalGptImage1 {
      prompt: Some("p".to_string()),
      image_urls,
      image_size,
      quality,
      num_images,
    }
  }

  fn cents_text(
    quality: FalGptImage1Quality,
    image_size: Option<FalGptImage1ImageSize>,
    num_images: FalGptImage1NumImages,
  ) -> u64 {
    estimate_image_cost_fal_gpt_image_1(&text_plan(quality, image_size, num_images))
      .cost_in_usd_cents
      .unwrap()
  }

  fn cents_edit(
    quality: FalGptImage1Quality,
    image_size: Option<FalGptImage1ImageSize>,
    num_images: FalGptImage1NumImages,
    num_input_images: usize,
  ) -> u64 {
    estimate_image_cost_fal_gpt_image_1(&edit_plan(quality, image_size, num_images, num_input_images))
      .cost_in_usd_cents
      .unwrap()
  }

  // ── Low quality text-to-image (2¢/image, both sizes) ──────────────────

  #[test]
  fn low_square_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::Low, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One), 2);
  }

  #[test]
  fn low_horizontal_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::Low, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::One), 2);
  }

  #[test]
  fn low_vertical_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::Low, Some(FalGptImage1ImageSize::Vertical), FalGptImage1NumImages::One), 2);
  }

  #[test]
  fn low_unset_size_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::Low, None, FalGptImage1NumImages::One), 2);
  }

  #[test]
  fn low_four_images() {
    assert_eq!(cents_text(FalGptImage1Quality::Low, None, FalGptImage1NumImages::Four), 8);
  }

  // ── Medium quality text-to-image (5¢ square, 7¢ wide/tall) ────────────

  #[test]
  fn medium_square_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One), 5);
  }

  #[test]
  fn medium_horizontal_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::One), 7);
  }

  #[test]
  fn medium_vertical_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Vertical), FalGptImage1NumImages::One), 7);
  }

  #[test]
  fn medium_square_four_images() {
    assert_eq!(cents_text(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::Four), 20);
  }

  #[test]
  fn medium_horizontal_four_images() {
    assert_eq!(cents_text(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::Four), 28);
  }

  // ── High quality text-to-image (17¢ square, 25¢ wide/tall) ────────────

  #[test]
  fn high_square_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One), 17);
  }

  #[test]
  fn high_horizontal_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::One), 25);
  }

  #[test]
  fn high_vertical_one_image() {
    assert_eq!(cents_text(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Vertical), FalGptImage1NumImages::One), 25);
  }

  #[test]
  fn high_square_two_images() {
    assert_eq!(cents_text(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::Two), 34);
  }

  #[test]
  fn high_horizontal_four_images() {
    assert_eq!(cents_text(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::Four), 100);
  }

  // ── Edit mode adds 2¢ per input image ─────────────────────────────────

  #[test]
  fn edit_high_square_one_output_one_input() {
    // 17¢ output + 2¢ input = 19¢
    assert_eq!(cents_edit(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One, 1), 19);
  }

  #[test]
  fn edit_high_square_one_output_three_inputs() {
    // 17¢ output + 3×2¢ input = 23¢
    assert_eq!(cents_edit(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One, 3), 23);
  }

  #[test]
  fn edit_medium_wide_two_outputs_five_inputs() {
    // 2×7¢ output + 5×2¢ input = 24¢
    assert_eq!(cents_edit(FalGptImage1Quality::Medium, Some(FalGptImage1ImageSize::Horizontal), FalGptImage1NumImages::Two, 5), 24);
  }

  #[test]
  fn edit_low_square_one_output_two_inputs() {
    // 2¢ output + 2×2¢ input = 6¢
    assert_eq!(cents_edit(FalGptImage1Quality::Low, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One, 2), 6);
  }

  #[test]
  fn edit_high_vertical_four_outputs_one_input() {
    // 4×25¢ output + 1×2¢ input = 102¢
    assert_eq!(cents_edit(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Vertical), FalGptImage1NumImages::Four, 1), 102);
  }

  // ── Text mode has no input image cost ─────────────────────────────────

  #[test]
  fn text_mode_no_input_cost() {
    assert_eq!(cents_text(FalGptImage1Quality::High, Some(FalGptImage1ImageSize::Square), FalGptImage1NumImages::One), 17);
  }

  // ── Metadata flags ────────────────────────────────────────────────────

  #[test]
  fn metadata_flags_are_default() {
    let estimate = estimate_image_cost_fal_gpt_image_1(&text_plan(
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
