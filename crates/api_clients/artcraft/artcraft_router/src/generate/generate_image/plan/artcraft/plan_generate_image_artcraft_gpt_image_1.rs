use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_quality::CommonQuality;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{
  GptImage1EditImageImageQuality, GptImage1EditImageImageSize, GptImage1EditImageNumImages,
};
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::{
  GenerateGptImage1TextToImageImageQuality, GenerateGptImage1TextToImageImageSize,
  GenerateGptImage1TextToImageNumImages,
};
use tokens::tokens::media_files::MediaFileToken;

/// Quality is shared between t2i and edit (Auto / Low / Medium / High).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArtcraftGptImage1Quality {
  Auto,
  Low,
  Medium,
  High,
}

/// Image size is shared between t2i and edit (Square / Horizontal / Vertical).
/// GPT Image 1 has no native auto size — None means "let the legacy handler
/// pick its default" (which is Square).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArtcraftGptImage1Size {
  Square,
  Horizontal,
  Vertical,
}

#[derive(Debug, Clone, Copy)]
pub enum ArtcraftGptImage1NumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Debug, Clone)]
pub struct PlanArtcraftGptImage1 {
  pub prompt: Option<String>,
  /// Input images for image editing. None means text-to-image mode.
  pub image_inputs: Option<Vec<MediaFileToken>>,
  /// Number of input images (0 for text-to-image). This is counted from either
  /// media tokens or hydrated URLs, so the cost estimator can use it without
  /// needing to inspect image_inputs (which is None for URL-form inputs).
  pub num_input_images: u64,
  pub image_size: Option<ArtcraftGptImage1Size>,
  /// Quality defaults to High when the request leaves it unspecified, matching
  /// the legacy storyteller-web handler defaults.
  pub quality: ArtcraftGptImage1Quality,
  pub num_images: ArtcraftGptImage1NumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_gpt_image_1(
  request: &GenerateImageRequest,
) -> Result<ImageGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let image_inputs = resolve_image_list_ref(request.image_inputs.clone())?;
  let num_input_images = count_input_images(request.image_inputs.clone());
  let image_size = plan_image_size(request.aspect_ratio);
  let quality = plan_quality(request.quality);
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::ArtcraftGptImage1(PlanArtcraftGptImage1 {
    prompt: request.prompt.clone(),
    image_inputs,
    num_input_images,
    image_size,
    quality,
    num_images,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Option<Vec<MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    // Omni-gen distillation hydrates media tokens to URLs before running the
    // Artcraft cost path. Cost only depends on quality + size + num_images +
    // is_edit_mode (derived before this resolver runs), so URL-form inputs are
    // accepted and dropped.
    Some(ImageListRef::Urls(_)) => Ok(None),
  }
}

fn count_input_images(image_inputs: Option<ImageListRef>) -> u64 {
  match image_inputs {
    None => 0,
    Some(ImageListRef::MediaFileTokens(tokens)) => tokens.len() as u64,
    Some(ImageListRef::Urls(urls)) => urls.len() as u64,
  }
}

fn plan_quality(quality: Option<CommonQuality>) -> ArtcraftGptImage1Quality {
  match quality {
    Some(CommonQuality::Low) => ArtcraftGptImage1Quality::Low,
    Some(CommonQuality::Medium) => ArtcraftGptImage1Quality::Medium,
    Some(CommonQuality::High) => ArtcraftGptImage1Quality::High,
    None => ArtcraftGptImage1Quality::High,
  }
}

// GPT Image 1 image sizes: Square (1024x1024), Horizontal (1536x1024),
// Vertical (1024x1536). All 17 CommonAspectRatio variants map to one of these
// or None (let the legacy handler default to Square).
fn plan_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<ArtcraftGptImage1Size> {
  use ArtcraftGptImage1Size as S;
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

// GPT Image 1 supports 1, 2, 3, and 4 images.
fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<ArtcraftGptImage1NumImages, ArtcraftRouterError> {
  use ArtcraftGptImage1NumImages as N;
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(N::One),
    2 => Ok(N::Two),
    3 => Ok(N::Three),
    4 => Ok(N::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(N::Four),
    },
  }
}

// ── Conversions to legacy storyteller-web request enums ────────────────────

impl ArtcraftGptImage1NumImages {
  pub fn to_t2i(self) -> GenerateGptImage1TextToImageNumImages {
    use GenerateGptImage1TextToImageNumImages as T;
    match self {
      Self::One => T::One,
      Self::Two => T::Two,
      Self::Three => T::Three,
      Self::Four => T::Four,
    }
  }

  pub fn to_edit(self) -> GptImage1EditImageNumImages {
    use GptImage1EditImageNumImages as E;
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

impl ArtcraftGptImage1Quality {
  pub fn to_t2i(self) -> GenerateGptImage1TextToImageImageQuality {
    use GenerateGptImage1TextToImageImageQuality as T;
    match self {
      Self::Auto => T::Auto,
      Self::Low => T::Low,
      Self::Medium => T::Medium,
      Self::High => T::High,
    }
  }

  pub fn to_edit(self) -> GptImage1EditImageImageQuality {
    use GptImage1EditImageImageQuality as E;
    match self {
      Self::Auto => E::Auto,
      Self::Low => E::Low,
      Self::Medium => E::Medium,
      Self::High => E::High,
    }
  }
}

impl ArtcraftGptImage1Size {
  pub fn to_t2i(self) -> GenerateGptImage1TextToImageImageSize {
    use GenerateGptImage1TextToImageImageSize as T;
    match self {
      Self::Square => T::Square,
      Self::Horizontal => T::Horizontal,
      Self::Vertical => T::Vertical,
    }
  }

  pub fn to_edit(self) -> GptImage1EditImageImageSize {
    use GptImage1EditImageImageSize as E;
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
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::image_list_ref::ImageListRef;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::test_helpers::base_gpt_image_1_image_request;

  // ── Image size (aspect ratio mapping) ────────────────────────────────────

  #[test]
  fn image_size_none_is_none() {
    let request = GenerateImageRequest { aspect_ratio: None, ..base_gpt_image_1_image_request() };
    let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
      panic!("expected ArtcraftGptImage1")
    };
    assert!(plan.image_size.is_none());
  }

  #[test]
  fn image_size_auto_variants_yield_none() {
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let request = GenerateImageRequest { aspect_ratio: Some(auto_ar), ..base_gpt_image_1_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
        panic!("expected ArtcraftGptImage1")
      };
      assert!(plan.image_size.is_none(), "expected None for {:?}", auto_ar);
    }
  }

  #[test]
  fn image_size_square_variants() {
    for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_gpt_image_1_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
        panic!("expected ArtcraftGptImage1")
      };
      assert!(matches!(plan.image_size, Some(ArtcraftGptImage1Size::Square)), "expected Square for {:?}", ar);
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
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_gpt_image_1_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
        panic!("expected ArtcraftGptImage1")
      };
      assert!(matches!(plan.image_size, Some(ArtcraftGptImage1Size::Horizontal)), "expected Horizontal for {:?}", ar);
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
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_gpt_image_1_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
        panic!("expected ArtcraftGptImage1")
      };
      assert!(matches!(plan.image_size, Some(ArtcraftGptImage1Size::Vertical)), "expected Vertical for {:?}", ar);
    }
  }

  // ── Quality default ──────────────────────────────────────────────────────

  #[test]
  fn quality_defaults_to_high() {
    let request = base_gpt_image_1_image_request();
    let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
      panic!("expected ArtcraftGptImage1")
    };
    assert!(matches!(plan.quality, ArtcraftGptImage1Quality::High));
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
        ..base_gpt_image_1_image_request()
      };
      let result = request.build();
      assert!(
        matches!(result, Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))),
        "expected UserRequestedZeroGenerations with {:?}", strategy,
      );
    }
  }

  #[test]
  fn num_images_default_is_one() {
    let request = GenerateImageRequest { image_batch_count: None, ..base_gpt_image_1_image_request() };
    let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
      panic!("expected ArtcraftGptImage1")
    };
    assert!(matches!(plan.num_images, ArtcraftGptImage1NumImages::One));
  }

  #[test]
  fn num_images_direct_mapping() {
    let cases = [
      (1, ArtcraftGptImage1NumImages::One),
      (2, ArtcraftGptImage1NumImages::Two),
      (3, ArtcraftGptImage1NumImages::Three),
      (4, ArtcraftGptImage1NumImages::Four),
    ];
    for (count, expected) in cases {
      let request = GenerateImageRequest { image_batch_count: Some(count), ..base_gpt_image_1_image_request() };
      let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
        panic!("expected ArtcraftGptImage1")
      };
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
      ..base_gpt_image_1_image_request()
    };
    let result = request.build();
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
        ..base_gpt_image_1_image_request()
      };
      let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
        panic!("expected ArtcraftGptImage1")
      };
      assert!(
        matches!(plan.num_images, ArtcraftGptImage1NumImages::Four),
        "expected Four for count 9 with {:?}", strategy,
      );
    }
  }

  // ── Image inputs (mode detection) ────────────────────────────────────────

  #[test]
  fn no_image_inputs_is_text_to_image_mode() {
    let request = GenerateImageRequest { image_inputs: None, ..base_gpt_image_1_image_request() };
    let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
      panic!("expected ArtcraftGptImage1")
    };
    assert!(plan.image_inputs.is_none());
  }

  #[test]
  fn media_token_image_inputs_is_edit_mode() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(tokens.clone())),
      ..base_gpt_image_1_image_request()
    };
    let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
      panic!("expected ArtcraftGptImage1")
    };
    assert!(plan.image_inputs.is_some());
  }

  #[test]
  fn url_image_inputs_are_accepted_for_cost_path() {
    // The omni-gen distillation hydrates media tokens to URLs before running
    // cost estimation against Artcraft. URLs are accepted (and dropped) since
    // cost only depends on quality + size + num_images.
    let urls = vec!["https://example.com/image.jpg".to_string()];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::Urls(urls.clone())),
      ..base_gpt_image_1_image_request()
    };
    let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
      panic!("expected ArtcraftGptImage1")
    };
    assert!(plan.image_inputs.is_none());
  }

  // ── Idempotency token ────────────────────────────────────────────────────

  #[test]
  fn idempotency_token_is_generated_when_unset() {
    let request = base_gpt_image_1_image_request();
    let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
      panic!("expected ArtcraftGptImage1")
    };
    assert!(!plan.idempotency_token.is_empty());
  }

  #[test]
  fn idempotency_token_passthrough() {
    let token = "11111111-1111-1111-1111-111111111111";
    let request = GenerateImageRequest { idempotency_token: Some(token.to_string()), ..base_gpt_image_1_image_request() };
    let ImageGenerationPlan::ArtcraftGptImage1(plan) = request.build().unwrap() else {
      panic!("expected ArtcraftGptImage1")
    };
    assert_eq!(plan.idempotency_token, token);
  }

  // ── Conversions to legacy storyteller-web request enums ─────────────────

  #[test]
  fn num_images_to_t2i_round_trip() {
    use GenerateGptImage1TextToImageNumImages as T;
    assert!(matches!(ArtcraftGptImage1NumImages::One.to_t2i(), T::One));
    assert!(matches!(ArtcraftGptImage1NumImages::Two.to_t2i(), T::Two));
    assert!(matches!(ArtcraftGptImage1NumImages::Three.to_t2i(), T::Three));
    assert!(matches!(ArtcraftGptImage1NumImages::Four.to_t2i(), T::Four));
  }

  #[test]
  fn num_images_to_edit_round_trip() {
    use GptImage1EditImageNumImages as E;
    assert!(matches!(ArtcraftGptImage1NumImages::One.to_edit(), E::One));
    assert!(matches!(ArtcraftGptImage1NumImages::Two.to_edit(), E::Two));
    assert!(matches!(ArtcraftGptImage1NumImages::Three.to_edit(), E::Three));
    assert!(matches!(ArtcraftGptImage1NumImages::Four.to_edit(), E::Four));
  }

  #[test]
  fn quality_to_t2i_round_trip() {
    use GenerateGptImage1TextToImageImageQuality as T;
    assert!(matches!(ArtcraftGptImage1Quality::Auto.to_t2i(), T::Auto));
    assert!(matches!(ArtcraftGptImage1Quality::Low.to_t2i(), T::Low));
    assert!(matches!(ArtcraftGptImage1Quality::Medium.to_t2i(), T::Medium));
    assert!(matches!(ArtcraftGptImage1Quality::High.to_t2i(), T::High));
  }

  #[test]
  fn quality_to_edit_round_trip() {
    use GptImage1EditImageImageQuality as E;
    assert!(matches!(ArtcraftGptImage1Quality::Auto.to_edit(), E::Auto));
    assert!(matches!(ArtcraftGptImage1Quality::Low.to_edit(), E::Low));
    assert!(matches!(ArtcraftGptImage1Quality::Medium.to_edit(), E::Medium));
    assert!(matches!(ArtcraftGptImage1Quality::High.to_edit(), E::High));
  }

  #[test]
  fn size_to_t2i_round_trip() {
    use GenerateGptImage1TextToImageImageSize as T;
    assert!(matches!(ArtcraftGptImage1Size::Square.to_t2i(), T::Square));
    assert!(matches!(ArtcraftGptImage1Size::Horizontal.to_t2i(), T::Horizontal));
    assert!(matches!(ArtcraftGptImage1Size::Vertical.to_t2i(), T::Vertical));
  }

  #[test]
  fn size_to_edit_round_trip() {
    use GptImage1EditImageImageSize as E;
    assert!(matches!(ArtcraftGptImage1Size::Square.to_edit(), E::Square));
    assert!(matches!(ArtcraftGptImage1Size::Horizontal.to_edit(), E::Horizontal));
    assert!(matches!(ArtcraftGptImage1Size::Vertical.to_edit(), E::Vertical));
  }
}
