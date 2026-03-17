use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use artcraft_api_defs::generate::image::multi_function::nano_banana_2_multi_function_image_gen::{
  NanaBanana2MultiFunctionImageGenAspectRatio, NanaBanana2MultiFunctionImageGenImageResolution,
  NanaBanana2MultiFunctionImageGenNumImages,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftNanaBanana2<'a> {
  pub prompt: Option<&'a str>,
  /// Input images for image editing. None means text-to-image mode.
  pub image_inputs: Option<&'a Vec<MediaFileToken>>,
  pub aspect_ratio: Option<NanaBanana2MultiFunctionImageGenAspectRatio>,
  pub resolution: Option<NanaBanana2MultiFunctionImageGenImageResolution>,
  pub num_images: NanaBanana2MultiFunctionImageGenNumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_nano_banana_2<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let is_edit_mode = request.image_inputs.is_some();
  let image_inputs = resolve_image_list_ref(request.image_inputs)?;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, is_edit_mode, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::ArtcraftNanaBanana2(PlanArtcraftNanaBanana2 {
    prompt: request.prompt,
    image_inputs,
    aspect_ratio,
    resolution,
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

// Nano Banana 2 supported aspect ratios:
//   Text-to-image: OneByOne, FiveByFour, FourByThree, ThreeByTwo, SixteenByNine, TwentyOneByNine,
//                  FourByFive, ThreeByFour, TwoByThree, NineBySixteen
//   Image editing: Auto (uses source image AR), plus all text-to-image ratios
fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  is_edit_mode: bool,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<NanaBanana2MultiFunctionImageGenAspectRatio>, ArtcraftRouterError> {
  use NanaBanana2MultiFunctionImageGenAspectRatio as Nb2Ar;
  match aspect_ratio {
    // No preference — let the model use its default
    None => Ok(None),

    // Auto: only valid in edit mode (use source image dimensions)
    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => {
      if is_edit_mode {
        Ok(Some(Nb2Ar::Auto))
      } else {
        // Auto not valid for text-to-image; fall back to square default
        Ok(Some(Nb2Ar::OneByOne))
      }
    }

    // Direct mappings
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(Nb2Ar::OneByOne)),
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(Nb2Ar::FiveByFour)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Nb2Ar::FourByThree)),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(Nb2Ar::ThreeByTwo)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Nb2Ar::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(Nb2Ar::TwentyOneByNine)),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Some(Nb2Ar::FourByFive)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Nb2Ar::ThreeByFour)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(Nb2Ar::TwoByThree)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Nb2Ar::NineBySixteen)),

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
fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> NanaBanana2MultiFunctionImageGenAspectRatio {
  use NanaBanana2MultiFunctionImageGenAspectRatio as Nb2Ar;
  match aspect_ratio {
    // TallNineByTwentyOne (0.43) — nearest is NineBySixteen (0.5625)
    CommonAspectRatio::TallNineByTwentyOne => Nb2Ar::NineBySixteen,
    _ => Nb2Ar::OneByOne,
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<NanaBanana2MultiFunctionImageGenImageResolution>, ArtcraftRouterError> {
  use CommonResolution as R;
  use NanaBanana2MultiFunctionImageGenImageResolution as Nb2Res;
  match resolution {
    None => Ok(None),
    Some(R::OneK) => Ok(Some(Nb2Res::OneK)),
    Some(R::TwoK) => Ok(Some(Nb2Res::TwoK)),
    Some(R::FourK) => Ok(Some(Nb2Res::FourK)),
    Some(R::ThreeK) => {
      // No 3K option; default to 2K
      Ok(Some(Nb2Res::TwoK))
    }
  }
}

// Nano Banana 2 supports 1, 2, 3, and 4 images.

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<NanaBanana2MultiFunctionImageGenNumImages, ArtcraftRouterError> {
  use NanaBanana2MultiFunctionImageGenNumImages as Nb2N;
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(Nb2N::One),
    2 => Ok(Nb2N::Two),
    3 => Ok(Nb2N::Three),
    4 => Ok(Nb2N::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Nb2N::Four),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Nb2N::Four),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::image_list_ref::ImageListRef;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::test_helpers::base_nano_banana_2_image_request;
  use artcraft_api_defs::generate::image::multi_function::nano_banana_2_multi_function_image_gen::{
    NanaBanana2MultiFunctionImageGenAspectRatio as Nb2Ar,
    NanaBanana2MultiFunctionImageGenImageResolution as Nb2Res,
    NanaBanana2MultiFunctionImageGenNumImages as Nb2N,
  };

  // ── Aspect ratio ────────────────────────────────────────────────────────────

  #[test]
  fn aspect_ratio_none_is_none() {
    let request = GenerateImageRequest { aspect_ratio: None, ..base_nano_banana_2_image_request() };
    let ImageGenerationPlan::ArtcraftNanaBanana2(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana2") };
    assert!(plan.aspect_ratio.is_none());
  }

  #[test]
  fn aspect_ratio_direct_square() {
    for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_nano_banana_2_image_request() };
      let ImageGenerationPlan::ArtcraftNanaBanana2(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana2") };
      assert!(matches!(plan.aspect_ratio, Some(Nb2Ar::OneByOne)), "expected OneByOne for {:?}", ar);
    }
  }

  #[test]
  fn aspect_ratio_auto_in_edit_mode_yields_auto() {
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let tokens = vec![];
      let request = GenerateImageRequest {
        aspect_ratio: Some(auto_ar),
        image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
        ..base_nano_banana_2_image_request()
      };
      let ImageGenerationPlan::ArtcraftNanaBanana2(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana2") };
      assert!(
        matches!(plan.aspect_ratio, Some(Nb2Ar::Auto)),
        "expected Auto in edit mode for {:?}", auto_ar,
      );
    }
  }

  #[test]
  fn aspect_ratio_auto_in_text_to_image_falls_back_to_square() {
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(auto_ar),
        image_inputs: None,
        ..base_nano_banana_2_image_request()
      };
      let ImageGenerationPlan::ArtcraftNanaBanana2(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana2") };
      assert!(
        matches!(plan.aspect_ratio, Some(Nb2Ar::OneByOne)),
        "expected OneByOne fallback in text-to-image for {:?}", auto_ar,
      );
    }
  }

  // ── Resolution ──────────────────────────────────────────────────────────────

  #[test]
  fn resolution_none_is_none() {
    let request = GenerateImageRequest { resolution: None, ..base_nano_banana_2_image_request() };
    let ImageGenerationPlan::ArtcraftNanaBanana2(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana2") };
    assert!(plan.resolution.is_none());
  }

  #[test]
  fn resolution_direct_mappings() {
    let cases = [
      (CommonResolution::OneK, Nb2Res::OneK),
      (CommonResolution::TwoK, Nb2Res::TwoK),
      (CommonResolution::FourK, Nb2Res::FourK),
    ];
    for (common, expected) in cases {
      let request = GenerateImageRequest { resolution: Some(common), ..base_nano_banana_2_image_request() };
      let ImageGenerationPlan::ArtcraftNanaBanana2(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana2") };
      assert!(
        matches!(plan.resolution, Some(r) if std::mem::discriminant(&r) == std::mem::discriminant(&expected)),
        "expected {:?} for {:?}", expected, common,
      );
    }
  }

  #[test]
  fn resolution_three_k_falls_back_to_two_k() {
    let request = GenerateImageRequest {
      resolution: Some(CommonResolution::ThreeK),
      ..base_nano_banana_2_image_request()
    };
    let ImageGenerationPlan::ArtcraftNanaBanana2(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana2") };
    assert!(matches!(plan.resolution, Some(Nb2Res::TwoK)));
  }

  // ── Num images ──────────────────────────────────────────────────────────────

  #[test]
  fn num_images_direct_mapping() {
    let cases = [
      (1, Nb2N::One),
      (2, Nb2N::Two),
      (3, Nb2N::Three),
      (4, Nb2N::Four),
    ];
    for (count, expected) in cases {
      let request = GenerateImageRequest { image_batch_count: Some(count), ..base_nano_banana_2_image_request() };
      let ImageGenerationPlan::ArtcraftNanaBanana2(plan) = request.build().unwrap() else { panic!("expected ArtcraftNanaBanana2") };
      assert!(
        std::mem::discriminant(&plan.num_images) == std::mem::discriminant(&expected),
        "expected {:?} for count {}", expected, count,
      );
    }
  }
}
