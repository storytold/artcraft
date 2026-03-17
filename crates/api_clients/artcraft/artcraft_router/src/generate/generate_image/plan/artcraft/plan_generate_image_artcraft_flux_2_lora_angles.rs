use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use artcraft_api_defs::generate::image::angle::flux_2_lora_edit_image_angle::{
  Flux2LoraEditImageAngleImageSize,
  Flux2LoraEditImageAngleNumImages,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftFlux2LoraAngles<'a> {
  pub image_input: &'a MediaFileToken,
  pub horizontal_angle: Option<f64>,
  pub vertical_angle: Option<f64>,
  pub zoom: Option<f64>,
  pub image_size: Option<Flux2LoraEditImageAngleImageSize>,
  pub num_images: Flux2LoraEditImageAngleNumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_flux_2_lora_angles<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  // Angle models require exactly one input image.
  let image_input = resolve_single_image_input(request.image_inputs)?;
  let image_size = plan_image_size(request.aspect_ratio, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::ArtcraftFlux2LoraAngles(PlanArtcraftFlux2LoraAngles {
    image_input,
    horizontal_angle: request.horizontal_angle,
    vertical_angle: request.vertical_angle,
    zoom: request.zoom,
    image_size,
    num_images,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn resolve_single_image_input<'a>(
  image_list_ref: Option<ImageListRef<'a>>,
) -> Result<&'a MediaFileToken, ArtcraftRouterError> {
  match image_list_ref {
    None => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_inputs",
        value: "Angle models require exactly one input image".to_string(),
      }))
    }
    Some(ImageListRef::MediaFileTokens(tokens)) => {
      if tokens.len() != 1 {
        return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_inputs",
          value: format!("Angle models require exactly one input image, got {}", tokens.len()),
        }));
      }
      Ok(&tokens[0])
    }
    Some(ImageListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

// Flux 2 LoRA supported image sizes:
//   Square, SquareHd
//   PortraitFourThree, PortraitSixteenNine
//   LandscapeFourThree, LandscapeSixteenNine
fn plan_image_size(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Flux2LoraEditImageAngleImageSize>, ArtcraftRouterError> {
  use Flux2LoraEditImageAngleImageSize as S;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto) | Some(CommonAspectRatio::Auto2k) | Some(CommonAspectRatio::Auto4k) => {
      Ok(Some(S::SquareHd))
    }

    Some(CommonAspectRatio::Square) => Ok(Some(S::Square)),
    Some(CommonAspectRatio::SquareHd) => Ok(Some(S::SquareHd)),

    Some(CommonAspectRatio::Wide) | Some(CommonAspectRatio::WideSixteenByNine) => Ok(Some(S::LandscapeSixteenNine)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(S::LandscapeFourThree)),

    Some(CommonAspectRatio::Tall) | Some(CommonAspectRatio::TallNineBySixteen) => Ok(Some(S::PortraitSixteenNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(S::PortraitFourThree)),

    Some(unsupported @ CommonAspectRatio::WideFiveByFour)
    | Some(unsupported @ CommonAspectRatio::WideThreeByTwo)
    | Some(unsupported @ CommonAspectRatio::WideTwentyOneByNine)
    | Some(unsupported @ CommonAspectRatio::TallFourByFive)
    | Some(unsupported @ CommonAspectRatio::TallTwoByThree)
    | Some(unsupported @ CommonAspectRatio::TallNineByTwentyOne) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(S::SquareHd)),
    },
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Flux2LoraEditImageAngleNumImages, ArtcraftRouterError> {
  use Flux2LoraEditImageAngleNumImages as N;
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
  use crate::api::image_list_ref::ImageListRef;
  use crate::test_helpers::base_flux_2_lora_angles_image_request;
  use artcraft_api_defs::generate::image::angle::flux_2_lora_edit_image_angle::{
    Flux2LoraEditImageAngleImageSize as S,
    Flux2LoraEditImageAngleNumImages as N,
  };
  use tokens::tokens::media_files::MediaFileToken;

  fn make_token() -> MediaFileToken {
    MediaFileToken::new_from_str("test_token_123")
  }

  #[test]
  fn requires_image_input() {
    let request = GenerateImageRequest {
      image_inputs: None,
      ..base_flux_2_lora_angles_image_request()
    };
    let result = request.build();
    assert!(result.is_err());
  }

  #[test]
  fn rejects_urls() {
    let urls = vec!["https://example.com/img.png".to_string()];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::Urls(&urls)),
      ..base_flux_2_lora_angles_image_request()
    };
    let result = request.build();
    assert!(result.is_err());
  }

  #[test]
  fn accepts_single_media_token() {
    let tokens = vec![make_token()];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_flux_2_lora_angles_image_request()
    };
    let result = request.build();
    assert!(result.is_ok());
  }

  #[test]
  fn rejects_multiple_media_tokens() {
    let tokens = vec![make_token(), make_token()];
    let request = GenerateImageRequest {
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_flux_2_lora_angles_image_request()
    };
    let result = request.build();
    assert!(result.is_err());
  }

  #[test]
  fn image_size_none_is_none() {
    let tokens = vec![make_token()];
    let request = GenerateImageRequest {
      aspect_ratio: None,
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_flux_2_lora_angles_image_request()
    };
    let ImageGenerationPlan::ArtcraftFlux2LoraAngles(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux2LoraAngles") };
    assert!(plan.image_size.is_none());
  }

  #[test]
  fn image_size_square_maps_directly() {
    let tokens = vec![make_token()];
    let request = GenerateImageRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_flux_2_lora_angles_image_request()
    };
    let ImageGenerationPlan::ArtcraftFlux2LoraAngles(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux2LoraAngles") };
    assert!(matches!(plan.image_size, Some(S::Square)));
  }

  #[test]
  fn num_images_direct_mapping() {
    let tokens = vec![make_token()];
    let cases = [(1, N::One), (2, N::Two), (3, N::Three), (4, N::Four)];
    for (count, expected) in cases {
      let request = GenerateImageRequest {
        image_batch_count: Some(count),
        image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
        ..base_flux_2_lora_angles_image_request()
      };
      let ImageGenerationPlan::ArtcraftFlux2LoraAngles(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux2LoraAngles") };
      assert!(
        std::mem::discriminant(&plan.num_images) == std::mem::discriminant(&expected),
        "expected {:?} for count {}", expected, count,
      );
    }
  }

  #[test]
  fn angle_fields_are_passed_through() {
    let tokens = vec![make_token()];
    let request = GenerateImageRequest {
      horizontal_angle: Some(45.0),
      vertical_angle: Some(-30.0),
      zoom: Some(1.5),
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      ..base_flux_2_lora_angles_image_request()
    };
    let ImageGenerationPlan::ArtcraftFlux2LoraAngles(plan) = request.build().unwrap() else { panic!("expected ArtcraftFlux2LoraAngles") };
    assert_eq!(plan.horizontal_angle, Some(45.0));
    assert_eq!(plan.vertical_angle, Some(-30.0));
    assert_eq!(plan.zoom, Some(1.5));
  }
}
