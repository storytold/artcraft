use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_1::{
  ArtcraftGptImage1Quality, ArtcraftGptImage1Size, PlanArtcraftGptImage1,
};

pub(crate) fn estimate_image_cost_artcraft_gpt_image_1(
  plan: &PlanArtcraftGptImage1,
) -> ImageGenerationCostEstimate {
  // Pricing per the fal-ai GPT Image 1 docs, adapted for our artcraft billing:
  //
  //   Output image cost (per output image):
  //     Low    – $0.011 (1024×1024) / $0.016 (other)  →  2¢ / 2¢
  //     Medium – $0.042 (1024×1024) / $0.063 (other)  →  5¢ / 7¢
  //     High   – $0.167 (1024×1024) / $0.250 (other)  → 17¢ / 25¢
  //
  //   Input image cost (edit mode only, per input image, high-fidelity assumed):
  //     3,050 tokens × $0.005/1K tokens ≈ $0.01525 → 2¢ per input image
  //
  //   Input text tokens: free (we don't charge for these).
  //
  let is_square = matches!(
    plan.image_size,
    None | Some(ArtcraftGptImage1Size::Square)
  );

  let output_cost_per_image: u64 = match (plan.quality, is_square) {
    (ArtcraftGptImage1Quality::Auto, _) => 17, // Auto treated as High square
    (ArtcraftGptImage1Quality::Low, true) => 2,
    (ArtcraftGptImage1Quality::Low, false) => 2,
    (ArtcraftGptImage1Quality::Medium, true) => 5,
    (ArtcraftGptImage1Quality::Medium, false) => 7,
    (ArtcraftGptImage1Quality::High, true) => 17,
    (ArtcraftGptImage1Quality::High, false) => 25,
  };

  let num_output_images = plan.num_images.as_u64();
  let output_cost = output_cost_per_image * num_output_images;

  // Input image token cost: 2¢ per input image (high-fidelity estimate).
  let input_image_cost: u64 = 2 * plan.num_input_images;

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
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::common_quality::CommonQuality;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
  use tokens::tokens::media_files::MediaFileToken;

  fn base() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: CommonImageModel::GptImage1,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: Some(1),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    }
  }

  fn estimate_text(
    quality: Option<CommonQuality>,
    aspect_ratio: Option<CommonAspectRatio>,
    batch: u16,
  ) -> u64 {
    let request = GenerateImageRequestBuilder {
      quality,
      aspect_ratio,
      image_batch_count: Some(batch),
      ..base()
    };
    request.build().unwrap().estimate_costs()
      .cost_in_usd_cents.unwrap()
  }

  fn estimate_edit(
    quality: Option<CommonQuality>,
    aspect_ratio: Option<CommonAspectRatio>,
    batch: u16,
    num_input_images: usize,
  ) -> u64 {
    let tokens: Vec<MediaFileToken> = (0..num_input_images)
      .map(|i| MediaFileToken::new_from_str(&format!("mf_test{:028}", i)))
      .collect();
    let request = GenerateImageRequestBuilder {
      quality,
      aspect_ratio,
      image_batch_count: Some(batch),
      image_inputs: Some(ImageListRef::MediaFileTokens(tokens.clone())),
      ..base()
    };
    request.build().unwrap().estimate_costs()
      .cost_in_usd_cents.unwrap()
  }

  // ── Default quality (None → High) ───────────────────────────────────────

  #[test]
  fn default_quality_square_one_image_costs_17_cents() {
    assert_eq!(estimate_text(None, None, 1), 17);
  }

  #[test]
  fn default_quality_square_four_images_costs_68_cents() {
    assert_eq!(estimate_text(None, None, 4), 68);
  }

  // ── Low quality (2¢/image regardless of size) ───────────────────────────

  #[test]
  fn low_square_one_image() {
    assert_eq!(estimate_text(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), 1), 2);
  }

  #[test]
  fn low_wide_one_image() {
    assert_eq!(estimate_text(Some(CommonQuality::Low), Some(CommonAspectRatio::WideSixteenByNine), 1), 2);
  }

  #[test]
  fn low_tall_one_image() {
    assert_eq!(estimate_text(Some(CommonQuality::Low), Some(CommonAspectRatio::TallNineBySixteen), 1), 2);
  }

  #[test]
  fn low_four_images() {
    assert_eq!(estimate_text(Some(CommonQuality::Low), None, 4), 8);
  }

  // ── Medium quality (5¢ square, 7¢ wide/tall) ───────────────────────────

  #[test]
  fn medium_square_one_image() {
    assert_eq!(estimate_text(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), 1), 5);
  }

  #[test]
  fn medium_wide_one_image() {
    assert_eq!(estimate_text(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), 1), 7);
  }

  #[test]
  fn medium_tall_one_image() {
    assert_eq!(estimate_text(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), 1), 7);
  }

  #[test]
  fn medium_square_four_images() {
    assert_eq!(estimate_text(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), 4), 20);
  }

  #[test]
  fn medium_wide_four_images() {
    assert_eq!(estimate_text(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), 4), 28);
  }

  // ── High quality (17¢ square, 25¢ wide/tall) ───────────────────────────

  #[test]
  fn high_square_one_image() {
    assert_eq!(estimate_text(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1), 17);
  }

  #[test]
  fn high_wide_one_image() {
    assert_eq!(estimate_text(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), 1), 25);
  }

  #[test]
  fn high_tall_one_image() {
    assert_eq!(estimate_text(Some(CommonQuality::High), Some(CommonAspectRatio::TallNineBySixteen), 1), 25);
  }

  #[test]
  fn high_square_four_images() {
    assert_eq!(estimate_text(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 4), 68);
  }

  #[test]
  fn high_wide_four_images() {
    assert_eq!(estimate_text(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), 4), 100);
  }

  // ── Edit mode: adds 2¢ per input image ─────────────────────────────────

  #[test]
  fn edit_one_input_adds_2_cents() {
    // High square 1 output = 17¢, plus 1 input × 2¢ = 19¢
    assert_eq!(estimate_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1, 1), 19);
  }

  #[test]
  fn edit_three_inputs_adds_6_cents() {
    // High square 1 output = 17¢, plus 3 inputs × 2¢ = 23¢
    assert_eq!(estimate_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1, 3), 23);
  }

  #[test]
  fn edit_five_inputs_adds_10_cents() {
    // Medium wide 2 outputs = 7×2 = 14¢, plus 5 inputs × 2¢ = 24¢
    assert_eq!(estimate_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), 2, 5), 24);
  }

  #[test]
  fn edit_low_quality_with_inputs() {
    // Low square 1 output = 2¢, plus 2 inputs × 2¢ = 6¢
    assert_eq!(estimate_edit(Some(CommonQuality::Low), None, 1, 2), 6);
  }

  // ── Text mode (no input images) has no input cost ──────────────────────

  #[test]
  fn text_mode_no_input_cost() {
    assert_eq!(estimate_text(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1), 17);
  }
}
