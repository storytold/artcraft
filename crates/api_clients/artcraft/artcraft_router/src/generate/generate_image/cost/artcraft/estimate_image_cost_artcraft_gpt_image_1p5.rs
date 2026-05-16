use artcraft_api_defs::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen::{
  GptImage1p5MultiFunctionImageGenNumImages, GptImage1p5MultiFunctionImageGenQuality,
  GptImage1p5MultiFunctionImageGenSize,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_1p5::PlanArtcraftGptImage1p5;

pub(crate) fn estimate_image_cost_artcraft_gpt_image_1p5(
  plan: &PlanArtcraftGptImage1p5,
) -> ImageGenerationCostEstimate {
  // Per fal docs (fal-ai/gpt-image-1.5 and fal-ai/gpt-image-1.5/edit):
  //
  //   Output image cost (per output image), rounded up to whole cents:
  //     Low:    $0.009 (1024×1024) / $0.013 (other)  →  1¢ / 2¢
  //     Medium: $0.034 (1024×1024) / $0.050 (1536×1024) / $0.051 (1024×1536)  →  4¢ / 5¢ / 6¢
  //     High:   $0.133 (1024×1024) / $0.199 (1536×1024) / $0.200 (1024×1536)  → 14¢ / 20¢ / 20¢
  //
  //   Input text tokens: free (we don't charge for these).
  //
  //   Default quality: High (when request.quality is None).
  //
  use GptImage1p5MultiFunctionImageGenQuality as Q;
  use GptImage1p5MultiFunctionImageGenSize as S;

  let cost_per_image: u64 = match (plan.quality, plan.image_size) {
    // Low quality
    (Q::Low, None | Some(S::Square)) => 1,
    (Q::Low, Some(S::Wide) | Some(S::Tall)) => 2,

    // Medium quality
    (Q::Medium, None | Some(S::Square)) => 4,
    (Q::Medium, Some(S::Wide)) => 5,
    (Q::Medium, Some(S::Tall)) => 6,

    // High quality
    (Q::High, None | Some(S::Square)) => 14,
    (Q::High, Some(S::Wide) | Some(S::Tall)) => 20,
  };

  let num_images: u64 = match plan.num_images {
    GptImage1p5MultiFunctionImageGenNumImages::One => 1,
    GptImage1p5MultiFunctionImageGenNumImages::Two => 2,
    GptImage1p5MultiFunctionImageGenNumImages::Three => 3,
    GptImage1p5MultiFunctionImageGenNumImages::Four => 4,
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

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::common_quality::CommonQuality;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn estimate(
    quality: Option<CommonQuality>,
    aspect_ratio: Option<CommonAspectRatio>,
    batch: u16,
  ) -> u64 {
    let request = GenerateImageRequestBuilder {
      model: CommonImageModel::GptImage1p5,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio,
      quality,
      image_batch_count: Some(batch),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    };
    request.build().unwrap().estimate_costs()
      .cost_in_usd_cents.unwrap()
  }

  // ── Default quality (None → High) ─────────────────────────────────────

  #[test]
  fn default_quality_square_one_image() {
    assert_eq!(estimate(None, Some(CommonAspectRatio::Square), 1), 14);
  }

  #[test]
  fn default_quality_unset_one_image() {
    assert_eq!(estimate(None, None, 1), 14);
  }

  #[test]
  fn default_quality_wide_one_image() {
    assert_eq!(estimate(None, Some(CommonAspectRatio::WideSixteenByNine), 1), 20);
  }

  #[test]
  fn default_quality_tall_one_image() {
    assert_eq!(estimate(None, Some(CommonAspectRatio::TallNineBySixteen), 1), 20);
  }

  #[test]
  fn default_quality_square_four_images() {
    assert_eq!(estimate(None, Some(CommonAspectRatio::Square), 4), 56);
  }

  // ── Low quality (1¢ square, 2¢ wide/tall) ─────────────────────────────

  #[test]
  fn low_square_one() {
    assert_eq!(estimate(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), 1), 1);
  }

  #[test]
  fn low_unset_one() {
    assert_eq!(estimate(Some(CommonQuality::Low), None, 1), 1);
  }

  #[test]
  fn low_wide_one() {
    assert_eq!(estimate(Some(CommonQuality::Low), Some(CommonAspectRatio::WideSixteenByNine), 1), 2);
  }

  #[test]
  fn low_tall_one() {
    assert_eq!(estimate(Some(CommonQuality::Low), Some(CommonAspectRatio::TallNineBySixteen), 1), 2);
  }

  #[test]
  fn low_square_four() {
    assert_eq!(estimate(Some(CommonQuality::Low), None, 4), 4);
  }

  #[test]
  fn low_wide_four() {
    assert_eq!(estimate(Some(CommonQuality::Low), Some(CommonAspectRatio::WideSixteenByNine), 4), 8);
  }

  // ── Medium quality (4¢ square, 5¢ wide, 6¢ tall) ─────────────────────

  #[test]
  fn medium_square_one() {
    assert_eq!(estimate(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), 1), 4);
  }

  #[test]
  fn medium_unset_one() {
    assert_eq!(estimate(Some(CommonQuality::Medium), None, 1), 4);
  }

  #[test]
  fn medium_wide_one() {
    assert_eq!(estimate(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), 1), 5);
  }

  #[test]
  fn medium_tall_one() {
    assert_eq!(estimate(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), 1), 6);
  }

  #[test]
  fn medium_square_four() {
    assert_eq!(estimate(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), 4), 16);
  }

  #[test]
  fn medium_wide_four() {
    assert_eq!(estimate(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), 4), 20);
  }

  #[test]
  fn medium_tall_four() {
    assert_eq!(estimate(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), 4), 24);
  }

  // ── High quality (14¢ square, 20¢ wide/tall) ─────────────────────────

  #[test]
  fn high_square_one() {
    assert_eq!(estimate(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1), 14);
  }

  #[test]
  fn high_unset_one() {
    assert_eq!(estimate(Some(CommonQuality::High), None, 1), 14);
  }

  #[test]
  fn high_wide_one() {
    assert_eq!(estimate(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), 1), 20);
  }

  #[test]
  fn high_tall_one() {
    assert_eq!(estimate(Some(CommonQuality::High), Some(CommonAspectRatio::TallNineBySixteen), 1), 20);
  }

  #[test]
  fn high_square_four() {
    assert_eq!(estimate(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 4), 56);
  }

  #[test]
  fn high_wide_four() {
    assert_eq!(estimate(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), 4), 80);
  }

  #[test]
  fn high_tall_four() {
    assert_eq!(estimate(Some(CommonQuality::High), Some(CommonAspectRatio::TallNineBySixteen), 4), 80);
  }
}
