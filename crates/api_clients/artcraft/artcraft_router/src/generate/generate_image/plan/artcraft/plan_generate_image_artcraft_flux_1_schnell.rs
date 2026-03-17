use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::generation_mode_mismatch_strategy::GenerationModeMismatchStrategy;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::{
  GenerateFlux1SchnellTextToImageAspectRatio, GenerateFlux1SchnellTextToImageNumImages,
};

#[derive(Debug, Clone)]
pub struct PlanArtcraftFlux1Schnell<'a> {
  pub prompt: Option<&'a str>,
  pub aspect_ratio: Option<GenerateFlux1SchnellTextToImageAspectRatio>,
  pub num_images: GenerateFlux1SchnellTextToImageNumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_flux_1_schnell<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  // Flux 1 Schnell is text-to-image only. Abort if image inputs are provided and
  // the caller has opted into strict mode.
  if request.image_inputs.is_some() {
    if let Some(GenerationModeMismatchStrategy::AbortGeneration) = request.generation_mode_mismatch_strategy {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_inputs",
        value: "Flux 1 Schnell is a text-to-image model and does not support image editing".to_string(),
      }));
    }
    // None or GenerateAnyway: silently ignore image inputs
  }

  let strategy = request.request_mismatch_mitigation_strategy;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::ArtcraftFlux1Schnell(PlanArtcraftFlux1Schnell {
    prompt: request.prompt,
    aspect_ratio,
    num_images,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

// Flux 1 Schnell supported aspect ratios (identical to Flux 1 Dev):
//   Square, SquareHd, LandscapeFourByThree, LandscapeSixteenByNine,
//   PortraitThreeByFour, PortraitNineBySixteen
fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GenerateFlux1SchnellTextToImageAspectRatio>, ArtcraftRouterError> {
  use GenerateFlux1SchnellTextToImageAspectRatio as FlAr;
  match aspect_ratio {
    None => Ok(None),

    // Auto: not valid for text-to-image; fall back to square
    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(FlAr::Square)),

    // Direct mappings
    Some(CommonAspectRatio::Square) => Ok(Some(FlAr::Square)),
    Some(CommonAspectRatio::SquareHd) => Ok(Some(FlAr::SquareHd)),
    Some(CommonAspectRatio::WideFourByThree) | Some(CommonAspectRatio::WideThreeByTwo) => {
      Ok(Some(FlAr::LandscapeFourByThree))
    }
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) | Some(CommonAspectRatio::WideTwentyOneByNine) => {
      Ok(Some(FlAr::LandscapeSixteenByNine))
    }
    Some(CommonAspectRatio::TallThreeByFour)
    | Some(CommonAspectRatio::TallTwoByThree)
    | Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(FlAr::PortraitThreeByFour)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) | Some(CommonAspectRatio::TallNineByTwentyOne) => {
      Ok(Some(FlAr::PortraitNineBySixteen))
    }

    // Mismatch — TallFourByFive maps to nearest (LandscapeFourByThree per existing desktop behavior)
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

fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> GenerateFlux1SchnellTextToImageAspectRatio {
  use GenerateFlux1SchnellTextToImageAspectRatio as FlAr;
  match aspect_ratio {
    // TallFourByFive (0.8) — nearest is LandscapeFourByThree per existing desktop behavior
    CommonAspectRatio::TallFourByFive => FlAr::LandscapeFourByThree,
    _ => FlAr::Square,
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<GenerateFlux1SchnellTextToImageNumImages, ArtcraftRouterError> {
  use GenerateFlux1SchnellTextToImageNumImages as FlN;
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FlN::One),
    2 => Ok(FlN::Two),
    3 => Ok(FlN::Three),
    4 => Ok(FlN::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(FlN::Four),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::image_list_ref::ImageListRef;
  use crate::client::generation_mode_mismatch_strategy::GenerationModeMismatchStrategy;
  use crate::errors::artcraft_router_error::ArtcraftRouterError;
  use crate::errors::client_error::ClientError;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use crate::test_helpers::base_flux_1_schnell_image_request;
  use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::{
    GenerateFlux1SchnellTextToImageAspectRatio as FlAr,
    GenerateFlux1SchnellTextToImageNumImages as FlN,
  };

  // ── Generation mode mismatch ─────────────────────────────────────────────

  #[test]
  fn image_inputs_with_abort_returns_error() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      generation_mode_mismatch_strategy: Some(GenerationModeMismatchStrategy::AbortGeneration),
      ..base_flux_1_schnell_image_request()
    };
    let result = request.build();
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "image_inputs", .. }))
    ));
  }

  #[test]
  fn image_inputs_with_generate_anyway_succeeds() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      generation_mode_mismatch_strategy: Some(GenerationModeMismatchStrategy::GenerateAnyway),
      ..base_flux_1_schnell_image_request()
    };
    assert!(request.build().is_ok());
  }

  #[test]
  fn image_inputs_with_none_strategy_succeeds() {
    let tokens = vec![];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      generation_mode_mismatch_strategy: None,
      ..base_flux_1_schnell_image_request()
    };
    assert!(request.build().is_ok());
  }

  // ── Aspect ratio ─────────────────────────────────────────────────────────

  #[test]
  fn aspect_ratio_none_is_none() {
    let request = GenerateImageRequest { aspect_ratio: None, ..base_flux_1_schnell_image_request() };
    let ImageGenerationPlan::ArtcraftFlux1Schnell(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux1Schnell") };
    assert!(plan.aspect_ratio.is_none());
  }

  #[test]
  fn aspect_ratio_auto_falls_back_to_square() {
    for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
      let request = GenerateImageRequest { aspect_ratio: Some(ar), ..base_flux_1_schnell_image_request() };
      let ImageGenerationPlan::ArtcraftFlux1Schnell(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux1Schnell") };
      assert!(matches!(plan.aspect_ratio, Some(FlAr::Square)), "expected Square for {:?}", ar);
    }
  }

  #[test]
  fn aspect_ratio_direct_mappings() {
    let cases = [
      (CommonAspectRatio::Square, FlAr::Square),
      (CommonAspectRatio::SquareHd, FlAr::SquareHd),
      (CommonAspectRatio::WideFourByThree, FlAr::LandscapeFourByThree),
      (CommonAspectRatio::WideThreeByTwo, FlAr::LandscapeFourByThree),
      (CommonAspectRatio::WideSixteenByNine, FlAr::LandscapeSixteenByNine),
      (CommonAspectRatio::Wide, FlAr::LandscapeSixteenByNine),
      (CommonAspectRatio::WideTwentyOneByNine, FlAr::LandscapeSixteenByNine),
      (CommonAspectRatio::TallThreeByFour, FlAr::PortraitThreeByFour),
      (CommonAspectRatio::TallTwoByThree, FlAr::PortraitThreeByFour),
      (CommonAspectRatio::WideFiveByFour, FlAr::PortraitThreeByFour),
      (CommonAspectRatio::TallNineBySixteen, FlAr::PortraitNineBySixteen),
      (CommonAspectRatio::Tall, FlAr::PortraitNineBySixteen),
      (CommonAspectRatio::TallNineByTwentyOne, FlAr::PortraitNineBySixteen),
    ];
    for (common, expected) in cases {
      let request = GenerateImageRequest { aspect_ratio: Some(common), ..base_flux_1_schnell_image_request() };
      let ImageGenerationPlan::ArtcraftFlux1Schnell(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux1Schnell") };
      assert!(
        matches!(plan.aspect_ratio, Some(ar) if std::mem::discriminant(&ar) == std::mem::discriminant(&expected)),
        "expected {:?} for {:?}", expected, common,
      );
    }
  }

  #[test]
  fn aspect_ratio_unsupported_error_out() {
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::TallFourByFive),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_flux_1_schnell_image_request()
    };
    assert!(matches!(
      request.build(),
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn aspect_ratio_unsupported_nearest_match() {
    for strategy in [
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateImageRequest {
        aspect_ratio: Some(CommonAspectRatio::TallFourByFive),
        request_mismatch_mitigation_strategy: strategy,
        ..base_flux_1_schnell_image_request()
      };
      let ImageGenerationPlan::ArtcraftFlux1Schnell(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux1Schnell") };
      assert!(matches!(plan.aspect_ratio, Some(FlAr::LandscapeFourByThree)));
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
        ..base_flux_1_schnell_image_request()
      };
      assert!(matches!(
        request.build(),
        Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))
      ));
    }
  }

  #[test]
  fn num_images_direct_mapping() {
    let cases = [(1, FlN::One), (2, FlN::Two), (3, FlN::Three), (4, FlN::Four)];
    for (count, expected) in cases {
      let request = GenerateImageRequest { image_batch_count: Some(count), ..base_flux_1_schnell_image_request() };
      let ImageGenerationPlan::ArtcraftFlux1Schnell(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux1Schnell") };
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
      ..base_flux_1_schnell_image_request()
    };
    assert!(matches!(
      request.build(),
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
        ..base_flux_1_schnell_image_request()
      };
      let ImageGenerationPlan::ArtcraftFlux1Schnell(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux1Schnell") };
      assert!(matches!(plan.num_images, FlN::Four));
    }
  }
}
