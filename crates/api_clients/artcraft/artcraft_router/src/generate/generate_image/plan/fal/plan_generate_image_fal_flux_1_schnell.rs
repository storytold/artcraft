use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::text::enqueue_flux_1_schnell_text_to_image_webhook::{
  Flux1SchnellAspectRatio, Flux1SchnellNumImages,
};

#[derive(Debug, Clone)]
pub struct PlanFalFlux1Schnell<'a> {
  pub prompt: Option<&'a str>,
  pub aspect_ratio: Flux1SchnellAspectRatio,
  pub num_images: Flux1SchnellNumImages,
}

pub fn plan_generate_image_fal_flux_1_schnell<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalFlux1Schnell(PlanFalFlux1Schnell {
    prompt: request.prompt,
    aspect_ratio,
    num_images,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Flux1SchnellAspectRatio, ArtcraftRouterError> {
  use Flux1SchnellAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(Ar::Square),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Ar::Square),

    Some(CommonAspectRatio::Square) => Ok(Ar::Square),
    Some(CommonAspectRatio::SquareHd) => Ok(Ar::SquareHd),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::LandscapeSixteenByNine),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Ar::PortraitThreeByFour),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::PortraitNineBySixteen),

    // Nearest-match for unsupported ratios
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Ar::LandscapeSixteenByNine),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Ar::PortraitThreeByFour),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Ar::PortraitThreeByFour),
    Some(CommonAspectRatio::TallNineByTwentyOne) => Ok(Ar::PortraitNineBySixteen),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Ar::Square),
    },
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Flux1SchnellNumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(Flux1SchnellNumImages::One),
    2 => Ok(Flux1SchnellNumImages::Two),
    3 => Ok(Flux1SchnellNumImages::Three),
    4 => Ok(Flux1SchnellNumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(Flux1SchnellNumImages::Four),
    },
  }
}
