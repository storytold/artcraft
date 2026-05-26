use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_quality::CommonQuality as CommonQualityEnum;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_1::request::ArtcraftGptImage1RequestState;

/// Cost state for Artcraft GPT Image 1. Pricing mirrors v1
/// (`estimate_image_cost_artcraft_gpt_image_1`):
///
///   Output image cost (per output image):
///     Low:    2¢ all sizes
///     Medium: 5¢ square, 7¢ wide/tall
///     High:   17¢ square, 25¢ wide/tall
///
///   Plus 2¢ per input image (high-fidelity estimate) in edit mode.
///   Quality defaults to High when unspecified.
#[derive(Clone, Debug)]
pub struct ArtcraftGptImage1CostState {
  pub quality: Option<CommonQualityEnum>,
  pub aspect_ratio: Option<CommonAspectRatioEnum>,
  pub num_images: u16,
  pub num_input_images: u64,
}

impl ArtcraftGptImage1CostState {
  pub fn from_request(request: &ArtcraftGptImage1RequestState) -> Self {
    Self {
      quality: request.request.quality,
      aspect_ratio: request.request.aspect_ratio,
      num_images: request.request.image_batch_count.unwrap_or(1),
      num_input_images: request.request.image_media_tokens
        .as_ref()
        .map(|t| t.len() as u64)
        .unwrap_or(0),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let quality = self.quality.unwrap_or(CommonQualityEnum::High);
    let is_square = is_square_or_none(self.aspect_ratio);

    let output_cost_per_image: u64 = match (quality, is_square) {
      (CommonQualityEnum::Low, _) => 2,
      (CommonQualityEnum::Medium, true) => 5,
      (CommonQualityEnum::Medium, false) => 7,
      (CommonQualityEnum::High, true) => 17,
      (CommonQualityEnum::High, false) => 25,
    };

    let output_cost = output_cost_per_image * self.num_images as u64;
    let input_image_cost = 2 * self.num_input_images;
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
}

fn is_square_or_none(aspect_ratio: Option<CommonAspectRatioEnum>) -> bool {
  use CommonAspectRatioEnum as Ar;
  matches!(
    aspect_ratio,
    None
    | Some(Ar::Auto)
    | Some(Ar::Auto2k)
    | Some(Ar::Auto3k)
    | Some(Ar::Auto4k)
    | Some(Ar::Square)
    | Some(Ar::SquareHd)
  )
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
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }

  fn cost_text(quality: Option<CommonQuality>, aspect_ratio: Option<CommonAspectRatio>, batch: u16) -> u64 {
    let builder = GenerateImageRequestBuilder {
      quality,
      aspect_ratio,
      image_batch_count: Some(batch),
      ..base()
    };
    builder.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  fn cost_edit(quality: Option<CommonQuality>, aspect_ratio: Option<CommonAspectRatio>, batch: u16, num_inputs: usize) -> u64 {
    let tokens: Vec<MediaFileToken> = (0..num_inputs)
      .map(|i| MediaFileToken::new_from_str(&format!("mf_test{:028}", i)))
      .collect();
    let builder = GenerateImageRequestBuilder {
      quality,
      aspect_ratio,
      image_batch_count: Some(batch),
      image_inputs: Some(ImageListRef::MediaFileTokens(tokens)),
      ..base()
    };
    builder.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  // ── Default (High square) → 17¢ ───────────────────────────────────────────

  #[test]
  fn default_one_image_is_17c() { assert_eq!(cost_text(None, None, 1), 17); }

  #[test]
  fn default_four_images_is_68c() { assert_eq!(cost_text(None, None, 4), 68); }

  // ── Low → 2¢ all sizes ────────────────────────────────────────────────────

  #[test]
  fn low_square_one() { assert_eq!(cost_text(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), 1), 2); }

  #[test]
  fn low_wide_one() { assert_eq!(cost_text(Some(CommonQuality::Low), Some(CommonAspectRatio::WideSixteenByNine), 1), 2); }

  #[test]
  fn low_tall_one() { assert_eq!(cost_text(Some(CommonQuality::Low), Some(CommonAspectRatio::TallNineBySixteen), 1), 2); }

  #[test]
  fn low_four_images() { assert_eq!(cost_text(Some(CommonQuality::Low), None, 4), 8); }

  // ── Medium ────────────────────────────────────────────────────────────────

  #[test]
  fn medium_square_one() { assert_eq!(cost_text(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), 1), 5); }

  #[test]
  fn medium_wide_one() { assert_eq!(cost_text(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), 1), 7); }

  #[test]
  fn medium_tall_one() { assert_eq!(cost_text(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), 1), 7); }

  // ── High ──────────────────────────────────────────────────────────────────

  #[test]
  fn high_square_one() { assert_eq!(cost_text(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1), 17); }

  #[test]
  fn high_wide_one() { assert_eq!(cost_text(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), 1), 25); }

  #[test]
  fn high_wide_four() { assert_eq!(cost_text(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), 4), 100); }

  // ── Edit mode adds 2¢ per input image ─────────────────────────────────────

  #[test]
  fn edit_one_input_adds_2c() {
    assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1, 1), 19);
  }

  #[test]
  fn edit_three_inputs_adds_6c() {
    assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1, 3), 23);
  }

  #[test]
  fn edit_five_inputs_adds_10c() {
    assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), 2, 5), 24);
  }
}
