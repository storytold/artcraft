use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_quality::CommonQuality as CommonQualityEnum;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::artcraft::gpt_image_2::request::ArtcraftGptImage2RequestState;

/// Cost state for Artcraft GPT Image 2. Pricing mirrors v1
/// (`estimate_image_cost_artcraft_gpt_image_2`):
///
///   Output image cost (per output image), rounded up to whole cents:
///     Low:    1¢ all sizes
///     Medium: 4¢ landscape/portrait 4:3 or 16:9; 6¢ square or auto
///     High:  15¢ landscape/portrait 4:3; 16¢ landscape/portrait 16:9;
///            22¢ square; 23¢ square_hd or auto
///
///   Quality defaults to High when unspecified.
#[derive(Clone, Debug)]
pub struct ArtcraftGptImage2CostState {
  pub quality: Option<CommonQualityEnum>,
  pub aspect_ratio: Option<CommonAspectRatioEnum>,
  pub num_images: u16,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum SizeBucket {
  Square,
  SquareHd,
  Landscape4x3,
  Landscape16x9,
  Portrait4x3,
  Portrait16x9,
  Auto,
}

impl ArtcraftGptImage2CostState {
  pub fn from_request(request: &ArtcraftGptImage2RequestState) -> Self {
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
      (CommonQualityEnum::Low, _) => 1,

      (CommonQualityEnum::Medium, SizeBucket::Square)
      | (CommonQualityEnum::Medium, SizeBucket::SquareHd)
      | (CommonQualityEnum::Medium, SizeBucket::Auto) => 6,
      (CommonQualityEnum::Medium, SizeBucket::Landscape4x3)
      | (CommonQualityEnum::Medium, SizeBucket::Portrait4x3)
      | (CommonQualityEnum::Medium, SizeBucket::Landscape16x9)
      | (CommonQualityEnum::Medium, SizeBucket::Portrait16x9) => 4,

      (CommonQualityEnum::High, SizeBucket::Square) => 22,
      (CommonQualityEnum::High, SizeBucket::SquareHd) | (CommonQualityEnum::High, SizeBucket::Auto) => 23,
      (CommonQualityEnum::High, SizeBucket::Landscape4x3)
      | (CommonQualityEnum::High, SizeBucket::Portrait4x3) => 15,
      (CommonQualityEnum::High, SizeBucket::Landscape16x9)
      | (CommonQualityEnum::High, SizeBucket::Portrait16x9) => 16,
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

/// Mirrors v1's `plan_image_size` for GPT Image 2 — see the v1 file
/// `plan_generate_image_artcraft_gpt_image_2.rs::plan_image_size`.
fn size_bucket(aspect_ratio: Option<CommonAspectRatioEnum>) -> SizeBucket {
  use CommonAspectRatioEnum as Ar;
  match aspect_ratio {
    None
    | Some(Ar::Auto)
    | Some(Ar::Auto2k)
    | Some(Ar::Auto3k)
    | Some(Ar::Auto4k) => SizeBucket::Auto,

    Some(Ar::Square) => SizeBucket::Square,
    Some(Ar::SquareHd) => SizeBucket::SquareHd,

    Some(Ar::WideFourByThree) | Some(Ar::WideFiveByFour) => SizeBucket::Landscape4x3,

    Some(Ar::WideThreeByTwo)
    | Some(Ar::WideSixteenByNine)
    | Some(Ar::WideTwentyOneByNine)
    | Some(Ar::Wide) => SizeBucket::Landscape16x9,

    Some(Ar::TallThreeByFour) | Some(Ar::TallFourByFive) => SizeBucket::Portrait4x3,

    Some(Ar::TallTwoByThree)
    | Some(Ar::TallNineBySixteen)
    | Some(Ar::TallNineByTwentyOne)
    | Some(Ar::Tall) => SizeBucket::Portrait16x9,
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
      model: CommonImageModel::GptImage2,
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

  // ── Low (1¢ all sizes) ────────────────────────────────────────────────────

  #[test]
  fn low_square() { assert_eq!(cost_cents(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), 1), 1); }

  #[test]
  fn low_square_hd() { assert_eq!(cost_cents(Some(CommonQuality::Low), Some(CommonAspectRatio::SquareHd), 1), 1); }

  #[test]
  fn low_landscape_4x3() { assert_eq!(cost_cents(Some(CommonQuality::Low), Some(CommonAspectRatio::WideFourByThree), 1), 1); }

  #[test]
  fn low_four() { assert_eq!(cost_cents(Some(CommonQuality::Low), None, 4), 4); }

  // ── Medium ────────────────────────────────────────────────────────────────

  #[test]
  fn medium_square_is_6c() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), 1), 6); }

  #[test]
  fn medium_square_hd_is_6c() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::SquareHd), 1), 6); }

  #[test]
  fn medium_auto_is_6c() { assert_eq!(cost_cents(Some(CommonQuality::Medium), None, 1), 6); }

  #[test]
  fn medium_landscape_4x3_is_4c() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideFourByThree), 1), 4); }

  #[test]
  fn medium_portrait_4x3_is_4c() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallThreeByFour), 1), 4); }

  #[test]
  fn medium_landscape_16x9_is_4c() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), 1), 4); }

  #[test]
  fn medium_portrait_16x9_is_4c() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), 1), 4); }

  #[test]
  fn medium_square_four_is_24c() { assert_eq!(cost_cents(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), 4), 24); }

  // ── High ──────────────────────────────────────────────────────────────────

  #[test]
  fn high_square_is_22c() { assert_eq!(cost_cents(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 1), 22); }

  #[test]
  fn high_square_hd_is_23c() { assert_eq!(cost_cents(Some(CommonQuality::High), Some(CommonAspectRatio::SquareHd), 1), 23); }

  #[test]
  fn high_auto_is_23c() { assert_eq!(cost_cents(Some(CommonQuality::High), None, 1), 23); }

  #[test]
  fn high_landscape_4x3_is_15c() { assert_eq!(cost_cents(Some(CommonQuality::High), Some(CommonAspectRatio::WideFourByThree), 1), 15); }

  #[test]
  fn high_landscape_16x9_is_16c() { assert_eq!(cost_cents(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), 1), 16); }

  #[test]
  fn high_square_four_is_88c() { assert_eq!(cost_cents(Some(CommonQuality::High), Some(CommonAspectRatio::Square), 4), 88); }

  #[test]
  fn high_square_hd_four_is_92c() { assert_eq!(cost_cents(Some(CommonQuality::High), Some(CommonAspectRatio::SquareHd), 4), 92); }
}
