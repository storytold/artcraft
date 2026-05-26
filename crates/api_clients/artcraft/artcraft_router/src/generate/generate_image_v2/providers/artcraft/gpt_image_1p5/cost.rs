use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_quality::CommonQuality as CommonQualityEnum;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_1p5::request::ArtcraftGptImage1p5RequestState;

/// Cost state for Artcraft GPT Image 1.5. Pricing mirrors v1
/// (`estimate_image_cost_artcraft_gpt_image_1p5`):
///
///   Output image cost (per output image):
///     Low:    1¢ square,  2¢ wide/tall
///     Medium: 4¢ square,  5¢ wide, 6¢ tall
///     High:  14¢ square, 20¢ wide/tall
///
///   Quality defaults to High when unspecified.
#[derive(Clone, Debug)]
pub struct ArtcraftGptImage1p5CostState {
  pub quality: Option<CommonQualityEnum>,
  pub aspect_ratio: Option<CommonAspectRatioEnum>,
  pub num_images: u16,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum SizeBucket {
  Square,
  Wide,
  Tall,
}

impl ArtcraftGptImage1p5CostState {
  pub fn from_request(request: &ArtcraftGptImage1p5RequestState) -> Self {
    Self {
      quality: request.request.quality,
      aspect_ratio: request.request.aspect_ratio,
      num_images: request.request.image_batch_count.unwrap_or(1),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let quality = self.quality.unwrap_or(CommonQualityEnum::High);
    let size = size_bucket(self.aspect_ratio);

    let cost_per_image: u64 = match (quality, size) {
      (CommonQualityEnum::Low, SizeBucket::Square) => 1,
      (CommonQualityEnum::Low, _) => 2,

      (CommonQualityEnum::Medium, SizeBucket::Square) => 4,
      (CommonQualityEnum::Medium, SizeBucket::Wide) => 5,
      (CommonQualityEnum::Medium, SizeBucket::Tall) => 6,

      (CommonQualityEnum::High, SizeBucket::Square) => 14,
      (CommonQualityEnum::High, _) => 20,
    };

    let cost_in_usd_cents = cost_per_image * self.num_images as u64;
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

fn size_bucket(aspect_ratio: Option<CommonAspectRatioEnum>) -> SizeBucket {
  use CommonAspectRatioEnum as Ar;
  match aspect_ratio {
    None
    | Some(Ar::Auto)
    | Some(Ar::Auto2k)
    | Some(Ar::Auto3k)
    | Some(Ar::Auto4k)
    | Some(Ar::Square)
    | Some(Ar::SquareHd) => SizeBucket::Square,

    Some(Ar::WideThreeByTwo)
    | Some(Ar::WideFourByThree)
    | Some(Ar::WideFiveByFour)
    | Some(Ar::WideSixteenByNine)
    | Some(Ar::WideTwentyOneByNine)
    | Some(Ar::Wide) => SizeBucket::Wide,

    Some(Ar::TallTwoByThree)
    | Some(Ar::TallThreeByFour)
    | Some(Ar::TallFourByFive)
    | Some(Ar::TallNineBySixteen)
    | Some(Ar::TallNineByTwentyOne)
    | Some(Ar::Tall) => SizeBucket::Tall,
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

  fn cost_cents(quality: Option<CommonQuality>, aspect_ratio: Option<CommonAspectRatio>, batch: u16) -> u64 {
    let builder = GenerateImageRequestBuilder {
      model: CommonImageModel::GptImage1p5,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio,
      quality,
      image_batch_count: Some(batch),
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    };
    builder.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  // ── Default (None → High) ─────────────────────────────────────────────────

  #[test]
  fn default_square_one() { assert_eq!(cost_cents(None, Some(CommonAspectRatio::Square), 1), 14); }

  #[test]
  fn default_unset_one() { assert_eq!(cost_cents(None, None, 1), 14); }

  #[test]
  fn default_wide_one() { assert_eq!(cost_cents(None, Some(CommonAspectRatio::WideSixteenByNine), 1), 20); }

  #[test]
  fn default_tall_one() { assert_eq!(cost_cents(None, Some(CommonAspectRatio::TallNineBySixteen), 1), 20); }

  #[test]
  fn default_square_four() { assert_eq!(cost_cents(None, Some(CommonAspectRatio::Square), 4), 56); }

  // ── Low ───────────────────────────────────────────────────────────────────

  #[test]
  fn low_square_one() { assert_eq!(cost_cents(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), 1), 1); }

  #[test]
  fn low_wide_one() { assert_eq!(cost_cents(Some(CommonQuality::Low), Some(CommonAspectRatio::WideSixteenByNine), 1), 2); }

  #[test]
  fn low_tall_one() { assert_eq!(cost_cents(Some(CommonQuality::Low), Some(CommonAspectRatio::TallNineBySixteen), 1), 2); }

  // ── Medium ────────────────────────────────────────────────────────────────

  #[test]
  fn medium_square_one() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), 1), 4); }

  #[test]
  fn medium_wide_one() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), 1), 5); }

  #[test]
  fn medium_tall_one() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), 1), 6); }

  #[test]
  fn medium_tall_four() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), 4), 24); }

  // ── High ──────────────────────────────────────────────────────────────────

  #[test]
  fn high_square_one() { assert_eq!(cost_cents(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1), 14); }

  #[test]
  fn high_wide_four() { assert_eq!(cost_cents(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), 4), 80); }
}
