use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_quality::CommonQuality;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_1_edit_image_webhook::{
  EnqueueGptImage1EditImageNumImages, EnqueueGptImage1EditImageQuality,
  EnqueueGptImage1EditImageSize,
};
use fal_client::requests::webhook::image::text::enqueue_gpt_image_1_text_to_image_webhook::{
  EnqueueGptImage1TextToImageNumImages, EnqueueGptImage1TextToImageQuality,
  EnqueueGptImage1TextToImageSize,
};

#[derive(Debug, Clone, Copy)]
pub enum FalGptImage1NumImages {
  One,
  Two,
  Three,
  Four,
}

/// Quality is shared between t2i and edit (Low / Medium / High).
#[derive(Debug, Clone, Copy)]
pub enum FalGptImage1Quality {
  Low,
  Medium,
  High,
}

/// GPT Image 1 supports three image sizes: 1024x1024, 1536x1024, 1024x1536.
#[derive(Debug, Clone, Copy)]
pub enum FalGptImage1ImageSize {
  Square,
  Horizontal,
  Vertical,
}

#[derive(Debug, Clone)]
pub struct PlanFalGptImage1 {
  pub prompt: Option<String>,
  /// Image URLs for editing. Empty vec = text-to-image mode.
  pub image_urls: Vec<String>,
  pub image_size: Option<FalGptImage1ImageSize>,
  /// Quality defaults to Medium when the request leaves it unspecified.
  /// (Matches the fal cost calculator default.)
  pub quality: FalGptImage1Quality,
  pub num_images: FalGptImage1NumImages,
}

pub fn plan_generate_image_fal_gpt_image_1(
  request: &GenerateImageRequest,
) -> Result<ImageGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let image_urls = resolve_image_list_ref(request.image_inputs.clone())?;
  let image_size = plan_image_size(request.aspect_ratio);
  let quality = plan_quality(request.quality);
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalGptImage1(PlanFalGptImage1 {
    prompt: request.prompt.clone(),
    image_urls,
    image_size,
    quality,
    num_images,
  }))
}

fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(vec![]),
    Some(ImageListRef::Urls(urls)) => Ok(urls.clone()),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn plan_quality(quality: Option<CommonQuality>) -> FalGptImage1Quality {
  match quality {
    Some(CommonQuality::Low) => FalGptImage1Quality::Low,
    Some(CommonQuality::Medium) => FalGptImage1Quality::Medium,
    Some(CommonQuality::High) => FalGptImage1Quality::High,
    None => FalGptImage1Quality::High,
  }
}

fn plan_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<FalGptImage1ImageSize> {
  use FalGptImage1ImageSize as S;
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => None,

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Some(S::Square),

    Some(CommonAspectRatio::WideThreeByTwo)
    | Some(CommonAspectRatio::WideFourByThree)
    | Some(CommonAspectRatio::WideFiveByFour)
    | Some(CommonAspectRatio::WideSixteenByNine)
    | Some(CommonAspectRatio::WideTwentyOneByNine)
    | Some(CommonAspectRatio::Wide) => Some(S::Horizontal),

    Some(CommonAspectRatio::TallTwoByThree)
    | Some(CommonAspectRatio::TallThreeByFour)
    | Some(CommonAspectRatio::TallFourByFive)
    | Some(CommonAspectRatio::TallNineBySixteen)
    | Some(CommonAspectRatio::TallNineByTwentyOne)
    | Some(CommonAspectRatio::Tall) => Some(S::Vertical),
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalGptImage1NumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalGptImage1NumImages::One),
    2 => Ok(FalGptImage1NumImages::Two),
    3 => Ok(FalGptImage1NumImages::Three),
    4 => Ok(FalGptImage1NumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FalGptImage1NumImages::Four),
    },
  }
}

// ── Conversions to fal-client enqueue enums ────────────────────────────────

impl FalGptImage1NumImages {
  pub fn to_t2i(self) -> EnqueueGptImage1TextToImageNumImages {
    use EnqueueGptImage1TextToImageNumImages as T;
    match self {
      Self::One => T::One,
      Self::Two => T::Two,
      Self::Three => T::Three,
      Self::Four => T::Four,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage1EditImageNumImages {
    use EnqueueGptImage1EditImageNumImages as E;
    match self {
      Self::One => E::One,
      Self::Two => E::Two,
      Self::Three => E::Three,
      Self::Four => E::Four,
    }
  }

  pub fn as_u64(self) -> u64 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Three => 3,
      Self::Four => 4,
    }
  }
}

impl FalGptImage1Quality {
  pub fn to_t2i(self) -> EnqueueGptImage1TextToImageQuality {
    use EnqueueGptImage1TextToImageQuality as T;
    match self {
      Self::Low => T::Low,
      Self::Medium => T::Medium,
      Self::High => T::High,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage1EditImageQuality {
    use EnqueueGptImage1EditImageQuality as E;
    match self {
      Self::Low => E::Low,
      Self::Medium => E::Medium,
      Self::High => E::High,
    }
  }
}

impl FalGptImage1ImageSize {
  pub fn to_t2i(self) -> EnqueueGptImage1TextToImageSize {
    use EnqueueGptImage1TextToImageSize as T;
    match self {
      Self::Square => T::Square,
      Self::Horizontal => T::Horizontal,
      Self::Vertical => T::Vertical,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage1EditImageSize {
    use EnqueueGptImage1EditImageSize as E;
    match self {
      Self::Square => E::Square,
      Self::Horizontal => E::Horizontal,
      Self::Vertical => E::Vertical,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;

  fn base_fal_request() -> GenerateImageRequest {
    GenerateImageRequest {
      model: CommonImageModel::GptImage1,
      provider: Provider::Fal,
      prompt: Some("a cat in space".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    }
  }

  fn build_plan(request: &GenerateImageRequest) -> PlanFalGptImage1 {
    let ImageGenerationPlan::FalGptImage1(plan) =
      plan_generate_image_fal_gpt_image_1(request).expect("plan should succeed")
    else {
      panic!("expected FalGptImage1 variant")
    };
    plan
  }

  // ── Mode detection ────────────────────────────────────────────────────────

  #[test]
  fn no_image_inputs_yields_empty_urls() {
    let request = GenerateImageRequest { image_inputs: None, ..base_fal_request() };
    let plan = build_plan(&request);
    assert!(plan.image_urls.is_empty());
  }

  #[test]
  fn url_image_inputs_are_extracted() {
    let urls = vec![
      "https://example.com/a.jpg".to_string(),
      "https://example.com/b.jpg".to_string(),
    ];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::Urls(urls.clone())),
      ..base_fal_request()
    };
    let plan = build_plan(&request);
    assert_eq!(plan.image_urls, urls);
  }

  #[test]
  fn media_token_inputs_return_error() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(tokens.clone())),
      ..base_fal_request()
    };
    let result = plan_generate_image_fal_gpt_image_1(&request);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    ));
  }

  // ── Quality default ──────────────────────────────────────────────────────

  #[test]
  fn quality_defaults_to_high() {
    let request = base_fal_request();
    let plan = build_plan(&request);
    assert!(matches!(plan.quality, FalGptImage1Quality::High));
  }

  // ── Image size mapping ───────────────────────────────────────────────────

  #[test]
  fn image_size_none_is_none() {
    let request = GenerateImageRequest { aspect_ratio: None, ..base_fal_request() };
    let plan = build_plan(&request);
    assert!(plan.image_size.is_none());
  }

  #[test]
  fn image_size_auto_variants_yield_none() {
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let request = GenerateImageRequest { aspect_ratio: Some(auto_ar), ..base_fal_request() };
      let plan = build_plan(&request);
      assert!(plan.image_size.is_none(), "expected None for {:?}", auto_ar);
    }
  }

  #[test]
  fn image_size_square_variants() {
    for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_fal_request() };
      let plan = build_plan(&request);
      assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Square)), "expected Square for {:?}", ar);
    }
  }

  #[test]
  fn image_size_wide_variants_yield_horizontal() {
    let wide_ars = [
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideFiveByFour,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::Wide,
    ];
    for ar in wide_ars {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_fal_request() };
      let plan = build_plan(&request);
      assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)), "expected Horizontal for {:?}", ar);
    }
  }

  #[test]
  fn image_size_tall_variants_yield_vertical() {
    let tall_ars = [
      CommonAspectRatio::TallTwoByThree,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallFourByFive,
      CommonAspectRatio::TallNineBySixteen,
      CommonAspectRatio::TallNineByTwentyOne,
      CommonAspectRatio::Tall,
    ];
    for ar in tall_ars {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_fal_request() };
      let plan = build_plan(&request);
      assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)), "expected Vertical for {:?}", ar);
    }
  }

  // ── Num images ───────────────────────────────────────────────────────────

  #[test]
  fn num_images_zero_is_always_error() {
    for strategy in [
      RequestMismatchMitigationStrategy::ErrorOut,
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateImageRequest {
        image_batch_count: Some(0),
        request_mismatch_mitigation_strategy: strategy,
        ..base_fal_request()
      };
      let result = plan_generate_image_fal_gpt_image_1(&request);
      assert!(
        matches!(result, Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))),
        "expected UserRequestedZeroGenerations with {:?}", strategy,
      );
    }
  }

  #[test]
  fn num_images_default_is_one() {
    let request = GenerateImageRequest { image_batch_count: None, ..base_fal_request() };
    let plan = build_plan(&request);
    assert!(matches!(plan.num_images, FalGptImage1NumImages::One));
  }

  #[test]
  fn num_images_direct_mapping() {
    let cases = [
      (1, FalGptImage1NumImages::One),
      (2, FalGptImage1NumImages::Two),
      (3, FalGptImage1NumImages::Three),
      (4, FalGptImage1NumImages::Four),
    ];
    for (count, expected) in cases {
      let request = GenerateImageRequest { image_batch_count: Some(count), ..base_fal_request() };
      let plan = build_plan(&request);
      assert!(
        std::mem::discriminant(&plan.num_images) == std::mem::discriminant(&expected),
        "expected {:?} for count {}", expected, count,
      );
    }
  }

  #[test]
  fn num_images_out_of_range_error_out() {
    let request = GenerateImageRequest {
      image_batch_count: Some(5),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_fal_request()
    };
    let result = plan_generate_image_fal_gpt_image_1(&request);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn num_images_out_of_range_clamps_to_four() {
    for strategy in [
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateImageRequest {
        image_batch_count: Some(9),
        request_mismatch_mitigation_strategy: strategy,
        ..base_fal_request()
      };
      let plan = build_plan(&request);
      assert!(
        matches!(plan.num_images, FalGptImage1NumImages::Four),
        "expected Four for count 9 with {:?}", strategy,
      );
    }
  }

  // ── as_u64 ───────────────────────────────────────────────────────────────

  #[test]
  fn num_images_as_u64() {
    assert_eq!(FalGptImage1NumImages::One.as_u64(), 1);
    assert_eq!(FalGptImage1NumImages::Two.as_u64(), 2);
    assert_eq!(FalGptImage1NumImages::Three.as_u64(), 3);
    assert_eq!(FalGptImage1NumImages::Four.as_u64(), 4);
  }

  // ── Conversions to fal-client enqueue enums ─────────────────────────────

  #[test]
  fn num_images_to_t2i_round_trip() {
    use EnqueueGptImage1TextToImageNumImages as T;
    assert!(matches!(FalGptImage1NumImages::One.to_t2i(), T::One));
    assert!(matches!(FalGptImage1NumImages::Two.to_t2i(), T::Two));
    assert!(matches!(FalGptImage1NumImages::Three.to_t2i(), T::Three));
    assert!(matches!(FalGptImage1NumImages::Four.to_t2i(), T::Four));
  }

  #[test]
  fn num_images_to_edit_round_trip() {
    use EnqueueGptImage1EditImageNumImages as E;
    assert!(matches!(FalGptImage1NumImages::One.to_edit(), E::One));
    assert!(matches!(FalGptImage1NumImages::Two.to_edit(), E::Two));
    assert!(matches!(FalGptImage1NumImages::Three.to_edit(), E::Three));
    assert!(matches!(FalGptImage1NumImages::Four.to_edit(), E::Four));
  }

  #[test]
  fn quality_to_t2i_round_trip() {
    use EnqueueGptImage1TextToImageQuality as T;
    assert!(matches!(FalGptImage1Quality::Low.to_t2i(), T::Low));
    assert!(matches!(FalGptImage1Quality::Medium.to_t2i(), T::Medium));
    assert!(matches!(FalGptImage1Quality::High.to_t2i(), T::High));
  }

  #[test]
  fn quality_to_edit_round_trip() {
    use EnqueueGptImage1EditImageQuality as E;
    assert!(matches!(FalGptImage1Quality::Low.to_edit(), E::Low));
    assert!(matches!(FalGptImage1Quality::Medium.to_edit(), E::Medium));
    assert!(matches!(FalGptImage1Quality::High.to_edit(), E::High));
  }

  #[test]
  fn size_to_t2i_round_trip() {
    use EnqueueGptImage1TextToImageSize as T;
    assert!(matches!(FalGptImage1ImageSize::Square.to_t2i(), T::Square));
    assert!(matches!(FalGptImage1ImageSize::Horizontal.to_t2i(), T::Horizontal));
    assert!(matches!(FalGptImage1ImageSize::Vertical.to_t2i(), T::Vertical));
  }

  #[test]
  fn size_to_edit_round_trip() {
    use EnqueueGptImage1EditImageSize as E;
    assert!(matches!(FalGptImage1ImageSize::Square.to_edit(), E::Square));
    assert!(matches!(FalGptImage1ImageSize::Horizontal.to_edit(), E::Horizontal));
    assert!(matches!(FalGptImage1ImageSize::Vertical.to_edit(), E::Vertical));
  }
}
