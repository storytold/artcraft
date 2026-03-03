use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4_multi_function_image_gen::{
  BytedanceSeedreamV4MultiFunctionImageGenImageSize,
  BytedanceSeedreamV4MultiFunctionImageGenNumImages,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftSeedream4<'a> {
  pub prompt: Option<&'a str>,
  /// Input images for image editing. None means text-to-image mode.
  pub image_inputs: Option<&'a Vec<MediaFileToken>>,
  pub image_size: Option<BytedanceSeedreamV4MultiFunctionImageGenImageSize>,
  pub num_images: BytedanceSeedreamV4MultiFunctionImageGenNumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_seedream_4<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<PlanArtcraftSeedream4<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let is_edit_mode = request.image_inputs.is_some();
  let image_inputs = resolve_image_list_ref(request.image_inputs)?;
  let image_size = plan_image_size(request.aspect_ratio, is_edit_mode, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(PlanArtcraftSeedream4 {
    prompt: request.prompt,
    image_inputs,
    image_size,
    num_images,
    idempotency_token: request.get_or_generate_idempotency_token(),
  })
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

// Seedream V4 supported image sizes:
//   Square, SquareHd
//   PortraitFourThree, PortraitSixteenNine
//   LandscapeFourThree, LandscapeSixteenNine
//   Auto (edit mode: preserve source dimensions), Auto2k, Auto4k
fn plan_image_size(
  aspect_ratio: Option<CommonAspectRatio>,
  is_edit_mode: bool,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<BytedanceSeedreamV4MultiFunctionImageGenImageSize>, ArtcraftRouterError> {
  use BytedanceSeedreamV4MultiFunctionImageGenImageSize as S;
  match aspect_ratio {
    None => Ok(None),

    // Auto: valid in edit mode (preserve source dimensions); fall back to Square for text-to-image
    Some(CommonAspectRatio::Auto) => {
      if is_edit_mode { Ok(Some(S::Auto)) } else { Ok(Some(S::Square)) }
    }

    Some(CommonAspectRatio::Auto2k) => Ok(Some(S::Auto2k)),
    Some(CommonAspectRatio::Auto4k) => Ok(Some(S::Auto4k)),

    // Square
    Some(CommonAspectRatio::Square) => Ok(Some(S::Square)),
    Some(CommonAspectRatio::SquareHd) => Ok(Some(S::SquareHd)),

    // Wide — direct mappings
    Some(CommonAspectRatio::Wide) | Some(CommonAspectRatio::WideSixteenByNine) => Ok(Some(S::LandscapeSixteenNine)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(S::LandscapeFourThree)),

    // Wide — no direct equivalent, nearest is LandscapeSixteenNine
    Some(unsupported @ CommonAspectRatio::WideFiveByFour)
    | Some(unsupported @ CommonAspectRatio::WideThreeByTwo)
    | Some(unsupported @ CommonAspectRatio::WideTwentyOneByNine) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(S::LandscapeSixteenNine)),
    },

    // Tall — direct mappings
    Some(CommonAspectRatio::Tall) | Some(CommonAspectRatio::TallNineBySixteen) => Ok(Some(S::PortraitSixteenNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(S::PortraitFourThree)),

    // Tall — no direct equivalent, nearest is PortraitSixteenNine
    Some(unsupported @ CommonAspectRatio::TallFourByFive)
    | Some(unsupported @ CommonAspectRatio::TallTwoByThree)
    | Some(unsupported @ CommonAspectRatio::TallNineByTwentyOne) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(S::PortraitSixteenNine)),
    },
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<BytedanceSeedreamV4MultiFunctionImageGenNumImages, ArtcraftRouterError> {
  use BytedanceSeedreamV4MultiFunctionImageGenNumImages as N;
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

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::image_list_ref::ImageListRef;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
  use crate::test_helpers::base_seedream_4_image_request;
  use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4_multi_function_image_gen::{
    BytedanceSeedreamV4MultiFunctionImageGenImageSize as S,
    BytedanceSeedreamV4MultiFunctionImageGenNumImages as N,
  };

  // ── Image size (from aspect ratio) ──────────────────────────────────────────

  #[test]
  fn image_size_none_is_none() {
    let request = GenerateImageRequest { aspect_ratio: None, ..base_seedream_4_image_request() };
    let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
    assert!(plan.image_size.is_none());
  }

  #[test]
  fn image_size_square() {
    for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_seedream_4_image_request() };
      let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
      let expected = match ar {
        CommonAspectRatio::Square => S::Square,
        CommonAspectRatio::SquareHd => S::SquareHd,
        _ => unreachable!(),
      };
      assert!(
        matches!(plan.image_size, Some(s) if std::mem::discriminant(&s) == std::mem::discriminant(&expected)),
        "expected {:?} for {:?}", expected, ar,
      );
    }
  }

  #[test]
  fn image_size_wide_direct() {
    let cases = [
      (CommonAspectRatio::Wide, S::LandscapeSixteenNine),
      (CommonAspectRatio::WideSixteenByNine, S::LandscapeSixteenNine),
      (CommonAspectRatio::WideFourByThree, S::LandscapeFourThree),
    ];
    for (ar, expected) in cases {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_seedream_4_image_request() };
      let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
      assert!(
        matches!(plan.image_size, Some(s) if std::mem::discriminant(&s) == std::mem::discriminant(&expected)),
        "expected {:?} for {:?}", expected, ar,
      );
    }
  }

  #[test]
  fn image_size_tall_direct() {
    let cases = [
      (CommonAspectRatio::Tall, S::PortraitSixteenNine),
      (CommonAspectRatio::TallNineBySixteen, S::PortraitSixteenNine),
      (CommonAspectRatio::TallThreeByFour, S::PortraitFourThree),
    ];
    for (ar, expected) in cases {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_seedream_4_image_request() };
      let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
      assert!(
        matches!(plan.image_size, Some(s) if std::mem::discriminant(&s) == std::mem::discriminant(&expected)),
        "expected {:?} for {:?}", expected, ar,
      );
    }
  }

  #[test]
  fn image_size_auto_in_edit_mode_yields_auto() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Auto),
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_seedream_4_image_request()
    };
    let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
    assert!(matches!(plan.image_size, Some(S::Auto)));
  }

  #[test]
  fn image_size_auto_in_text_to_image_yields_square() {
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Auto),
      image_inputs: None,
      ..base_seedream_4_image_request()
    };
    let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
    assert!(matches!(plan.image_size, Some(S::Square)));
  }

  #[test]
  fn image_size_auto2k_and_auto4k() {
    for (ar, expected) in [(CommonAspectRatio::Auto2k, S::Auto2k), (CommonAspectRatio::Auto4k, S::Auto4k)] {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_seedream_4_image_request() };
      let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
      assert!(
        matches!(plan.image_size, Some(s) if std::mem::discriminant(&s) == std::mem::discriminant(&expected)),
        "expected {:?} for {:?}", expected, ar,
      );
    }
  }

  #[test]
  fn image_size_unsupported_error_out() {
    for ar in [CommonAspectRatio::WideFiveByFour, CommonAspectRatio::TallFourByFive] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(ar),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
        ..base_seedream_4_image_request()
      };
      assert!(matches!(
        request.build(),
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
      ), "expected error for {:?}", ar);
    }
  }

  #[test]
  fn image_size_unsupported_nearest_match() {
    for strategy in [RequestMismatchMitigationStrategy::PayMoreUpgrade, RequestMismatchMitigationStrategy::PayLessDowngrade] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(CommonAspectRatio::WideFiveByFour),
        request_mismatch_mitigation_strategy: strategy,
        ..base_seedream_4_image_request()
      };
      let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
      assert!(matches!(plan.image_size, Some(S::LandscapeSixteenNine)), "expected LandscapeSixteenNine with {:?}", strategy);

      let request = GenerateImageRequest {
        aspect_ratio: Some(CommonAspectRatio::TallFourByFive),
        request_mismatch_mitigation_strategy: strategy,
        ..base_seedream_4_image_request()
      };
      let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
      assert!(matches!(plan.image_size, Some(S::PortraitSixteenNine)), "expected PortraitSixteenNine with {:?}", strategy);
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
        ..base_seedream_4_image_request()
      };
      assert!(
        matches!(request.build(), Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))),
        "expected UserRequestedZeroGenerations with {:?}", strategy,
      );
    }
  }

  #[test]
  fn num_images_direct_mapping() {
    let cases = [(1, N::One), (2, N::Two), (3, N::Three), (4, N::Four)];
    for (count, expected) in cases {
      let request = GenerateImageRequest { image_batch_count: Some(count), ..base_seedream_4_image_request() };
      let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
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
      ..base_seedream_4_image_request()
    };
    assert!(matches!(
      request.build(),
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn num_images_out_of_range_clamps_to_four() {
    for strategy in [RequestMismatchMitigationStrategy::PayMoreUpgrade, RequestMismatchMitigationStrategy::PayLessDowngrade] {
      let request = GenerateImageRequest {
        image_batch_count: Some(5),
        request_mismatch_mitigation_strategy: strategy,
        ..base_seedream_4_image_request()
      };
      let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
      assert!(matches!(plan.num_images, N::Four), "expected Four for count 5 with {:?}", strategy);
    }
  }

  // ── Image inputs ──────────────────────────────────────────────────────────

  #[test]
  fn url_image_inputs_returns_error() {
    let urls = vec!["https://example.com/image.jpg".to_string()];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::Urls(&urls)),
      ..base_seedream_4_image_request()
    };
    assert!(matches!(
      request.build(),
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }

  #[test]
  fn no_image_inputs_is_text_to_image_mode() {
    let request = GenerateImageRequest { image_inputs: None, ..base_seedream_4_image_request() };
    let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
    assert!(plan.image_inputs.is_none());
  }

  #[test]
  fn media_token_image_inputs_is_edit_mode() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_seedream_4_image_request()
    };
    let ImageGenerationPlan::ArtcraftSeedream4(plan) = request.build().unwrap() else { panic!("expected ArtcraftSeedream4") };
    assert!(plan.image_inputs.is_some());
  }
}
