use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::text::enqueue_flux_pro_11_ultra_text_to_image_webhook::{
  FluxPro11UltraAspectRatio, FluxPro11UltraNumImages,
};

#[derive(Debug, Clone, Copy)]
pub enum FalFluxPro11UltraNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Debug, Clone)]
pub struct PlanFalFluxPro11Ultra<'a> {
  pub prompt: Option<&'a str>,
  pub aspect_ratio: FluxPro11UltraAspectRatio,
  pub num_images: FalFluxPro11UltraNumImages,
}

pub fn plan_generate_image_fal_flux_pro_1p1_ultra<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  if request.image_inputs.is_some() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "image_inputs",
      value: "Flux Pro 1.1 Ultra is text-to-image only".to_string(),
    }));
  }

  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalFluxPro11Ultra(PlanFalFluxPro11Ultra {
    prompt: request.prompt,
    aspect_ratio,
    num_images,
  }))
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FluxPro11UltraAspectRatio, ArtcraftRouterError> {
  use FluxPro11UltraAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(Ar::Square),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Ar::Square),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Ar::Square),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Ar::LandscapeThreeByTwo),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::LandscapeSixteenByNine),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Ar::LandscapeTwentyOneByNine),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Ar::PortraitThreeByFour),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Ar::PortraitTwoByThree),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::PortraitNineBySixteen),
    Some(CommonAspectRatio::TallNineByTwentyOne) => Ok(Ar::PortraitNineByTwentyOne),

    Some(CommonAspectRatio::WideFiveByFour) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Ar::PortraitThreeByFour),

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
) -> Result<FalFluxPro11UltraNumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalFluxPro11UltraNumImages::One),
    2 => Ok(FalFluxPro11UltraNumImages::Two),
    3 => Ok(FalFluxPro11UltraNumImages::Three),
    4 => Ok(FalFluxPro11UltraNumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FalFluxPro11UltraNumImages::Four),
    },
  }
}

impl FalFluxPro11UltraNumImages {
  pub fn to_fal(self) -> FluxPro11UltraNumImages {
    match self {
      Self::One => FluxPro11UltraNumImages::One,
      Self::Two => FluxPro11UltraNumImages::Two,
      Self::Three => FluxPro11UltraNumImages::Three,
      Self::Four => FluxPro11UltraNumImages::Four,
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
