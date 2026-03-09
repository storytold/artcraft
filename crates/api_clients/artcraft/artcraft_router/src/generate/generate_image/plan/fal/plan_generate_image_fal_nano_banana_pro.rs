use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use fal_client::requests::webhook::image::edit::enqueue_nano_banana_pro_edit_image_webhook::EnqueueNanoBananaProEditImageAspectRatio;
use fal_client::requests::webhook::image::text::enqueue_nano_banana_pro_text_to_image_webhook::EnqueueNanoBananaProTextToImageAspectRatio;

/// Intermediate resolution type shared between t2i and edit enums
/// (both have the same variants: OneK, TwoK, FourK).
#[derive(Debug, Clone, Copy)]
pub enum FalNbpResolution {
  OneK,
  TwoK,
  FourK,
}

/// Intermediate num-images type shared between t2i and edit enums
/// (both have the same variants: One, Two, Three, Four).
#[derive(Debug, Clone, Copy)]
pub enum FalNbpNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Debug, Clone)]
pub struct PlanFalNanaBananaPro<'a> {
  pub prompt: Option<&'a str>,
  /// Image URLs for editing. Empty vec = text-to-image mode.
  pub image_urls: Vec<String>,
  /// Pre-resolved aspect ratio for text-to-image mode.
  pub t2i_aspect_ratio: Option<EnqueueNanoBananaProTextToImageAspectRatio>,
  /// Pre-resolved aspect ratio for image-edit mode.
  pub edit_aspect_ratio: Option<EnqueueNanoBananaProEditImageAspectRatio>,
  /// Pre-resolved resolution (shared for both modes).
  pub resolution: Option<FalNbpResolution>,
  /// Pre-resolved number of images (1–4, shared for both modes).
  pub num_images: FalNbpNumImages,
}

pub fn plan_generate_image_fal_nano_banana_pro<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<PlanFalNanaBananaPro<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let is_edit_mode = request.image_inputs.is_some();
  let image_urls = resolve_image_list_ref(request.image_inputs)?;
  let t2i_aspect_ratio = plan_t2i_aspect_ratio(request.aspect_ratio, strategy)?;
  let edit_aspect_ratio = plan_edit_aspect_ratio(request.aspect_ratio, is_edit_mode, strategy)?;
  let resolution = plan_resolution(request.resolution)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(PlanFalNanaBananaPro {
    prompt: request.prompt,
    image_urls,
    t2i_aspect_ratio,
    edit_aspect_ratio,
    resolution,
    num_images,
  })
}

fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef<'_>>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(vec![]),
    Some(ImageListRef::Urls(urls)) => Ok(urls.clone()),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

// Nano Banana Pro text-to-image supported aspect ratios:
//   OneByOne, FiveByFour, FourByThree, ThreeByTwo, SixteenByNine, TwentyOneByNine,
//   FourByFive, ThreeByFour, TwoByThree, NineBySixteen
//   (no Auto — that's edit-only)
fn plan_t2i_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<EnqueueNanoBananaProTextToImageAspectRatio>, ArtcraftRouterError> {
  use EnqueueNanoBananaProTextToImageAspectRatio as T2iAr;
  match aspect_ratio {
    None => Ok(None),

    // Auto not valid for text-to-image; fall back to square
    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(T2iAr::OneByOne)),

    // Direct mappings
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(T2iAr::OneByOne)),
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(T2iAr::FiveByFour)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(T2iAr::FourByThree)),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(T2iAr::ThreeByTwo)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(T2iAr::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(T2iAr::TwentyOneByNine)),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Some(T2iAr::FourByFive)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(T2iAr::ThreeByFour)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(T2iAr::TwoByThree)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(T2iAr::NineBySixteen)),

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
        Ok(Some(nearest_t2i_aspect_ratio(unsupported)))
      }
    },
  }
}

fn nearest_t2i_aspect_ratio(
  aspect_ratio: CommonAspectRatio,
) -> EnqueueNanoBananaProTextToImageAspectRatio {
  use EnqueueNanoBananaProTextToImageAspectRatio as T2iAr;
  match aspect_ratio {
    // TallNineByTwentyOne (0.43) — nearest is NineBySixteen (0.5625)
    CommonAspectRatio::TallNineByTwentyOne => T2iAr::NineBySixteen,
    _ => T2iAr::OneByOne,
  }
}

// Nano Banana Pro image-edit supported aspect ratios:
//   Auto (use source image dims), plus all text-to-image ratios
fn plan_edit_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  is_edit_mode: bool,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<EnqueueNanoBananaProEditImageAspectRatio>, ArtcraftRouterError> {
  use EnqueueNanoBananaProEditImageAspectRatio as EditAr;
  match aspect_ratio {
    None => Ok(None),

    // Auto: valid in edit mode (use source image dimensions)
    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => {
      if is_edit_mode {
        Ok(Some(EditAr::Auto))
      } else {
        Ok(Some(EditAr::OneByOne))
      }
    }

    // Direct mappings
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(EditAr::OneByOne)),
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(EditAr::FiveByFour)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(EditAr::FourByThree)),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(EditAr::ThreeByTwo)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(EditAr::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(EditAr::TwentyOneByNine)),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Some(EditAr::FourByFive)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(EditAr::ThreeByFour)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(EditAr::TwoByThree)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(EditAr::NineBySixteen)),

    // Mismatch
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(nearest_edit_aspect_ratio(unsupported)))
      }
    },
  }
}

fn nearest_edit_aspect_ratio(
  aspect_ratio: CommonAspectRatio,
) -> EnqueueNanoBananaProEditImageAspectRatio {
  use EnqueueNanoBananaProEditImageAspectRatio as EditAr;
  match aspect_ratio {
    CommonAspectRatio::TallNineByTwentyOne => EditAr::NineBySixteen,
    _ => EditAr::OneByOne,
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
) -> Result<Option<FalNbpResolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),
    Some(CommonResolution::OneK) => Ok(Some(FalNbpResolution::OneK)),
    Some(CommonResolution::TwoK) => Ok(Some(FalNbpResolution::TwoK)),
    Some(CommonResolution::FourK) => Ok(Some(FalNbpResolution::FourK)),
    // No 3K option; fall back to 2K
    Some(CommonResolution::ThreeK) => Ok(Some(FalNbpResolution::TwoK)),
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalNbpNumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalNbpNumImages::One),
    2 => Ok(FalNbpNumImages::Two),
    3 => Ok(FalNbpNumImages::Three),
    4 => Ok(FalNbpNumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(FalNbpNumImages::Four),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(FalNbpNumImages::Four),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::provider::Provider;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use fal_client::requests::webhook::image::edit::enqueue_nano_banana_pro_edit_image_webhook::EnqueueNanoBananaProEditImageAspectRatio as EditAr;
  use fal_client::requests::webhook::image::text::enqueue_nano_banana_pro_text_to_image_webhook::EnqueueNanoBananaProTextToImageAspectRatio as T2iAr;

  fn base_fal_request() -> GenerateImageRequest<'static> {
    GenerateImageRequest {
      model: CommonImageModel::NanaBananaPro,
      provider: Provider::Fal,
      prompt: Some("a cat in space"),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      image_batch_count: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    }
  }

  fn build_plan<'a>(
    request: &'a GenerateImageRequest<'a>,
  ) -> PlanFalNanaBananaPro<'a> {
    plan_generate_image_fal_nano_banana_pro(request).expect("plan should succeed")
  }

  // ── Image inputs / mode detection ────────────────────────────────────────────

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
      image_inputs: Some(ImageListRef::Urls(&urls)),
      ..base_fal_request()
    };
    let plan = build_plan(&request);
    assert_eq!(plan.image_urls, urls);
  }

  #[test]
  fn media_token_inputs_return_error() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_fal_request()
    };
    let result = plan_generate_image_fal_nano_banana_pro(&request);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    ));
  }

  // ── Text-to-image aspect ratio ────────────────────────────────────────────────

  #[test]
  fn t2i_aspect_ratio_none_is_none() {
    let request = GenerateImageRequest { aspect_ratio: None, ..base_fal_request() };
    let plan = build_plan(&request);
    assert!(plan.t2i_aspect_ratio.is_none());
  }

  #[test]
  fn t2i_aspect_ratio_auto_falls_back_to_square() {
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(auto_ar),
        image_inputs: None,
        ..base_fal_request()
      };
      let plan = build_plan(&request);
      assert!(
        matches!(plan.t2i_aspect_ratio, Some(T2iAr::OneByOne)),
        "expected OneByOne fallback in text-to-image for {:?}", auto_ar,
      );
    }
  }

  #[test]
  fn t2i_aspect_ratio_direct_mappings() {
    let cases = [
      (CommonAspectRatio::Square, T2iAr::OneByOne),
      (CommonAspectRatio::SquareHd, T2iAr::OneByOne),
      (CommonAspectRatio::WideFiveByFour, T2iAr::FiveByFour),
      (CommonAspectRatio::WideFourByThree, T2iAr::FourByThree),
      (CommonAspectRatio::WideThreeByTwo, T2iAr::ThreeByTwo),
      (CommonAspectRatio::WideSixteenByNine, T2iAr::SixteenByNine),
      (CommonAspectRatio::Wide, T2iAr::SixteenByNine),
      (CommonAspectRatio::WideTwentyOneByNine, T2iAr::TwentyOneByNine),
      (CommonAspectRatio::TallFourByFive, T2iAr::FourByFive),
      (CommonAspectRatio::TallThreeByFour, T2iAr::ThreeByFour),
      (CommonAspectRatio::TallTwoByThree, T2iAr::TwoByThree),
      (CommonAspectRatio::TallNineBySixteen, T2iAr::NineBySixteen),
      (CommonAspectRatio::Tall, T2iAr::NineBySixteen),
    ];
    for (common, expected) in cases {
      let request = GenerateImageRequest { aspect_ratio: Some(common), ..base_fal_request() };
      let plan = build_plan(&request);
      assert!(
        matches!(plan.t2i_aspect_ratio, Some(ar) if std::mem::discriminant(&ar) == std::mem::discriminant(&expected)),
        "expected {:?} for {:?}", expected, common,
      );
    }
  }

  #[test]
  fn t2i_aspect_ratio_unsupported_error_out() {
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::TallNineByTwentyOne),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_fal_request()
    };
    let result = plan_generate_image_fal_nano_banana_pro(&request);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn t2i_aspect_ratio_unsupported_nearest_match() {
    for strategy in [
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(CommonAspectRatio::TallNineByTwentyOne),
        request_mismatch_mitigation_strategy: strategy,
        ..base_fal_request()
      };
      let plan = build_plan(&request);
      assert!(
        matches!(plan.t2i_aspect_ratio, Some(T2iAr::NineBySixteen)),
        "expected NineBySixteen nearest match with {:?}", strategy,
      );
    }
  }

  // ── Edit aspect ratio ─────────────────────────────────────────────────────────

  #[test]
  fn edit_aspect_ratio_auto_in_edit_mode_yields_auto() {
    let urls = vec!["https://example.com/img.jpg".to_string()];
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(auto_ar),
        image_inputs: Some(ImageListRef::Urls(&urls)),
        ..base_fal_request()
      };
      let plan = build_plan(&request);
      assert!(
        matches!(plan.edit_aspect_ratio, Some(EditAr::Auto)),
        "expected Auto in edit mode for {:?}", auto_ar,
      );
    }
  }

  #[test]
  fn edit_aspect_ratio_auto_in_text_to_image_falls_back_to_square() {
    for auto_ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(auto_ar),
        image_inputs: None,
        ..base_fal_request()
      };
      let plan = build_plan(&request);
      assert!(
        matches!(plan.edit_aspect_ratio, Some(EditAr::OneByOne)),
        "expected OneByOne in text-to-image for {:?}", auto_ar,
      );
    }
  }

  // ── Resolution ────────────────────────────────────────────────────────────────

  #[test]
  fn resolution_none_is_none() {
    let request = GenerateImageRequest { resolution: None, ..base_fal_request() };
    let plan = build_plan(&request);
    assert!(plan.resolution.is_none());
  }

  #[test]
  fn resolution_direct_mappings() {
    let cases = [
      (CommonResolution::OneK, FalNbpResolution::OneK),
      (CommonResolution::TwoK, FalNbpResolution::TwoK),
      (CommonResolution::FourK, FalNbpResolution::FourK),
    ];
    for (common, expected) in cases {
      let request = GenerateImageRequest { resolution: Some(common), ..base_fal_request() };
      let plan = build_plan(&request);
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
      ..base_fal_request()
    };
    let plan = build_plan(&request);
    assert!(matches!(plan.resolution, Some(FalNbpResolution::TwoK)));
  }

  // ── Num images ────────────────────────────────────────────────────────────────

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
      let result = plan_generate_image_fal_nano_banana_pro(&request);
      assert!(
        matches!(result, Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))),
        "expected UserRequestedZeroGenerations with {:?}", strategy,
      );
    }
  }

  #[test]
  fn num_images_direct_mapping() {
    let cases = [
      (1, FalNbpNumImages::One),
      (2, FalNbpNumImages::Two),
      (3, FalNbpNumImages::Three),
      (4, FalNbpNumImages::Four),
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
    let result = plan_generate_image_fal_nano_banana_pro(&request);
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
        ..base_fal_request()
      };
      let plan = build_plan(&request);
      assert!(
        matches!(plan.num_images, FalNbpNumImages::Four),
        "expected Four for count 5 with {:?}", strategy,
      );
    }
  }
}
