use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use artcraft_api_defs::generate::image::multi_function::nano_banana_multi_function_image_gen::{
  NanoBananaMultiFunctionImageGenAspectRatio, NanoBananaMultiFunctionImageGenNumImages,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftNanaBanana<'a> {
  pub prompt: Option<&'a str>,
  /// Input images for image editing. None means text-to-image mode.
  pub image_inputs: Option<&'a Vec<MediaFileToken>>,
  pub aspect_ratio: Option<NanoBananaMultiFunctionImageGenAspectRatio>,
  pub num_images: NanoBananaMultiFunctionImageGenNumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_nano_banana<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let is_edit_mode = request.image_inputs.is_some();
  let image_inputs = resolve_image_list_ref(request.image_inputs)?;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, is_edit_mode, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::ArtcraftNanaBanana(PlanArtcraftNanaBanana {
    prompt: request.prompt,
    image_inputs,
    aspect_ratio,
    num_images,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn resolve_image_list_ref<'a>(
  image_list_ref: Option<ImageListRef<'a>>,
) -> Result<Option<&'a Vec<MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(ImageListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

// Nano Banana supported aspect ratios:
//   Text-to-image: OneByOne, FiveByFour, FourByThree, ThreeByTwo, SixteenByNine, TwentyOneByNine,
//                  FourByFive, ThreeByFour, TwoByThree, NineBySixteen
//   Image editing: Auto (uses source image AR), plus all text-to-image ratios
fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  is_edit_mode: bool,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<NanoBananaMultiFunctionImageGenAspectRatio>, ArtcraftRouterError> {
  use NanoBananaMultiFunctionImageGenAspectRatio as NbAr;
  match aspect_ratio {
    // No preference — let the model use its default
    None => Ok(None),

    // Auto: only valid in edit mode (use source image dimensions)
    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => {
      if is_edit_mode {
        Ok(Some(NbAr::Auto))
      } else {
        // Auto not valid for text-to-image; fall back to square default
        Ok(Some(NbAr::OneByOne))
      }
    }

    // Direct mappings
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(NbAr::OneByOne)),
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(NbAr::FiveByFour)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(NbAr::FourByThree)),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(NbAr::ThreeByTwo)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(NbAr::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(NbAr::TwentyOneByNine)),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Some(NbAr::FourByFive)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(NbAr::ThreeByFour)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(NbAr::TwoByThree)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(NbAr::NineBySixteen)),

    // Mismatch — TallNineByTwentyOne has no direct equivalent
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(nearest_aspect_ratio(unsupported)))
      }
    },
  }
}

/// Pick the nearest supported aspect ratio for unsupported inputs.
fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> NanoBananaMultiFunctionImageGenAspectRatio {
  use NanoBananaMultiFunctionImageGenAspectRatio as NbAr;
  match aspect_ratio {
    // TallNineByTwentyOne (0.43) — nearest is NineBySixteen (0.5625)
    CommonAspectRatio::TallNineByTwentyOne => NbAr::NineBySixteen,
    _ => NbAr::OneByOne,
  }
}

// Nano Banana supports 1, 2, 3, and 4 images.

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<NanoBananaMultiFunctionImageGenNumImages, ArtcraftRouterError> {
  use NanoBananaMultiFunctionImageGenNumImages as NbN;
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(NbN::One),
    2 => Ok(NbN::Two),
    3 => Ok(NbN::Three),
    4 => Ok(NbN::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(NbN::Four),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(NbN::Four),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::image_list_ref::ImageListRef;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::test_helpers::base_nano_banana_image_request;
  use artcraft_api_defs::generate::image::multi_function::nano_banana_multi_function_image_gen::{
    NanoBananaMultiFunctionImageGenAspectRatio as NbAr,
    NanoBananaMultiFunctionImageGenNumImages as NbN,
  };

  // ── Aspect ratio ────────────────────────────────────────────────────────────

  #[test]
  fn aspect_ratio_none_is_none() {
    let request = GenerateImageRequest { aspect_ratio: None, ..base_nano_banana_image_request() };
    let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
    assert!(plan.aspect_ratio.is_none());
  }

  #[test]
  fn aspect_ratio_direct_square() {
    for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_nano_banana_image_request() };
      let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
      assert!(matches!(plan.aspect_ratio, Some(NbAr::OneByOne)), "expected OneByOne for {:?}", ar);
    }
  }

  #[test]
  fn aspect_ratio_direct_wide() {
    let cases = [
      (CommonAspectRatio::WideFiveByFour, NbAr::FiveByFour),
      (CommonAspectRatio::WideFourByThree, NbAr::FourByThree),
      (CommonAspectRatio::WideThreeByTwo, NbAr::ThreeByTwo),
      (CommonAspectRatio::WideSixteenByNine, NbAr::SixteenByNine),
      (CommonAspectRatio::Wide, NbAr::SixteenByNine),
      (CommonAspectRatio::WideTwentyOneByNine, NbAr::TwentyOneByNine),
    ];
    for (common, expected) in cases {
      let request = GenerateImageRequest { aspect_ratio: Some(common), ..base_nano_banana_image_request() };
      let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
      assert!(
        matches!(plan.aspect_ratio, Some(ar) if std::mem::discriminant(&ar) == std::mem::discriminant(&expected)),
        "expected {:?} for {:?}", expected, common,
      );
    }
  }

  #[test]
  fn aspect_ratio_direct_tall() {
    let cases = [
      (CommonAspectRatio::TallFourByFive, NbAr::FourByFive),
      (CommonAspectRatio::TallThreeByFour, NbAr::ThreeByFour),
      (CommonAspectRatio::TallTwoByThree, NbAr::TwoByThree),
      (CommonAspectRatio::TallNineBySixteen, NbAr::NineBySixteen),
      (CommonAspectRatio::Tall, NbAr::NineBySixteen),
    ];
    for (common, expected) in cases {
      let request = GenerateImageRequest { aspect_ratio: Some(common), ..base_nano_banana_image_request() };
      let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
      assert!(
        matches!(plan.aspect_ratio, Some(ar) if std::mem::discriminant(&ar) == std::mem::discriminant(&expected)),
        "expected {:?} for {:?}", expected, common,
      );
    }
  }

  #[test]
  fn aspect_ratio_auto_in_edit_mode_yields_auto() {
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let tokens = vec![];
      let request = GenerateImageRequest {
        aspect_ratio: Some(auto_ar),
        image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
        ..base_nano_banana_image_request()
      };
      let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
      assert!(
        matches!(plan.aspect_ratio, Some(NbAr::Auto)),
        "expected Auto in edit mode for {:?}", auto_ar,
      );
    }
  }

  #[test]
  fn aspect_ratio_auto_in_text_to_image_mode_falls_back_to_square() {
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(auto_ar),
        image_inputs: None,
        ..base_nano_banana_image_request()
      };
      let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
      assert!(
        matches!(plan.aspect_ratio, Some(NbAr::OneByOne)),
        "expected OneByOne fallback in text-to-image for {:?}", auto_ar,
      );
    }
  }

  #[test]
  fn aspect_ratio_unsupported_error_out() {
    // TallNineByTwentyOne has no direct equivalent
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::TallNineByTwentyOne),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_nano_banana_image_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn aspect_ratio_unsupported_nearest_match() {
    // TallNineByTwentyOne (0.43) is nearest to NineBySixteen (0.5625)
    for strategy in [
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(CommonAspectRatio::TallNineByTwentyOne),
        request_mismatch_mitigation_strategy: strategy,
        ..base_nano_banana_image_request()
      };
      let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
      assert!(
        matches!(plan.aspect_ratio, Some(NbAr::NineBySixteen)),
        "expected NineBySixteen nearest match with {:?}", strategy,
      );
    }
  }

  // ── Num images ──────────────────────────────────────────────────────────────

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
        ..base_nano_banana_image_request()
      };
      let result = request.build();
      assert!(
        matches!(result, Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))),
        "expected UserRequestedZeroGenerations with {:?}", strategy,
      );
    }
  }

  #[test]
  fn num_images_direct_mapping() {
    let cases = [
      (1, NbN::One),
      (2, NbN::Two),
      (3, NbN::Three),
      (4, NbN::Four),
    ];
    for (count, expected) in cases {
      let request = GenerateImageRequest { image_batch_count: Some(count), ..base_nano_banana_image_request() };
      let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
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
      ..base_nano_banana_image_request()
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
        image_batch_count: Some(5),
        request_mismatch_mitigation_strategy: strategy,
        ..base_nano_banana_image_request()
      };
      let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
      assert!(
        matches!(plan.num_images, NbN::Four),
        "expected Four for count 5 with {:?}", strategy,
      );
    }
  }

  // ── Image inputs ─────────────────────────────────────────────────────────

  #[test]
  fn url_image_inputs_returns_error() {
    let urls = vec!["https://example.com/image.jpg".to_string()];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::Urls(&urls)),
      ..base_nano_banana_image_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }

  #[test]
  fn no_image_inputs_is_text_to_image_mode() {
    let request = GenerateImageRequest { image_inputs: None, ..base_nano_banana_image_request() };
    let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
    assert!(plan.image_inputs.is_none());
  }

  #[test]
  fn media_token_image_inputs_is_edit_mode() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_nano_banana_image_request()
    };
    let ImageGenerationPlan::ArtcraftNanaBanana(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana") };
    assert!(plan.image_inputs.is_some());
  }
}
