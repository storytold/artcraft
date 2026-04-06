use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::edit::enqueue_flux_1_schnell_edit_image_webhook::{
  Flux1SchnellEditImageNumImages, Flux1SchnellEditImageSize,
};
use fal_client::requests::webhook::image::text::enqueue_flux_1_schnell_text_to_image_webhook::{
  Flux1SchnellAspectRatio, Flux1SchnellNumImages,
};

/// Shared num-images type for both t2i and edit modes.
#[derive(Debug, Clone, Copy)]
pub enum FalFlux1SchnellNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Debug, Clone)]
pub struct PlanFalFlux1Schnell<'a> {
  pub prompt: Option<&'a str>,
  /// Image URL for editing. None = text-to-image mode.
  pub maybe_image_url: Option<String>,
  pub t2i_aspect_ratio: Flux1SchnellAspectRatio,
  pub edit_image_size: Option<Flux1SchnellEditImageSize>,
  pub num_images: FalFlux1SchnellNumImages,
}

pub fn plan_generate_image_fal_flux_1_schnell<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let maybe_image_url = resolve_single_image_url(request.image_inputs)?;
  let t2i_aspect_ratio = plan_t2i_aspect_ratio(request.aspect_ratio, strategy)?;
  let edit_image_size = plan_edit_image_size(request.aspect_ratio);
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalFlux1Schnell(PlanFalFlux1Schnell {
    prompt: request.prompt,
    maybe_image_url,
    t2i_aspect_ratio,
    edit_image_size,
    num_images,
  }))
}

fn resolve_single_image_url(
  image_inputs: Option<ImageListRef<'_>>,
) -> Result<Option<String>, ArtcraftRouterError> {
  match image_inputs {
    None => Ok(None),
    Some(ImageListRef::Urls(urls)) => {
      if urls.is_empty() {
        Ok(None)
      } else if urls.len() == 1 {
        Ok(Some(urls[0].clone()))
      } else {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_inputs",
          value: format!("Flux 1 Schnell redux supports exactly 1 image, got {}", urls.len()),
        }))
      }
    }
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn plan_t2i_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Flux1SchnellAspectRatio, ArtcraftRouterError> {
  use Flux1SchnellAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(Ar::Square),
    Some(CommonAspectRatio::Auto) | Some(CommonAspectRatio::Auto2k) | Some(CommonAspectRatio::Auto4k) => Ok(Ar::Square),
    Some(CommonAspectRatio::Square) => Ok(Ar::Square),
    Some(CommonAspectRatio::SquareHd) => Ok(Ar::SquareHd),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Ar::LandscapeSixteenByNine),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Ar::PortraitThreeByFour),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Ar::PortraitNineBySixteen),
    Some(CommonAspectRatio::WideFiveByFour) | Some(CommonAspectRatio::WideThreeByTwo) => Ok(Ar::LandscapeFourByThree),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Ar::LandscapeSixteenByNine),
    Some(CommonAspectRatio::TallFourByFive) | Some(CommonAspectRatio::TallTwoByThree) => Ok(Ar::PortraitThreeByFour),
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

fn plan_edit_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<Flux1SchnellEditImageSize> {
  use Flux1SchnellEditImageSize as Size;
  match aspect_ratio {
    None => None,
    Some(CommonAspectRatio::Square) => Some(Size::Square),
    Some(CommonAspectRatio::SquareHd) => Some(Size::SquareHd),
    Some(CommonAspectRatio::WideFourByThree) => Some(Size::LandscapeFourByThree),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Some(Size::LandscapeSixteenByNine),
    Some(CommonAspectRatio::TallThreeByFour) => Some(Size::PortraitThreeByFour),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Some(Size::PortraitNineBySixteen),
    _ => Some(Size::Square),
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalFlux1SchnellNumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalFlux1SchnellNumImages::One),
    2 => Ok(FalFlux1SchnellNumImages::Two),
    3 => Ok(FalFlux1SchnellNumImages::Three),
    4 => Ok(FalFlux1SchnellNumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FalFlux1SchnellNumImages::Four),
    },
  }
}

impl FalFlux1SchnellNumImages {
  pub fn to_t2i(self) -> Flux1SchnellNumImages {
    match self {
      Self::One => Flux1SchnellNumImages::One,
      Self::Two => Flux1SchnellNumImages::Two,
      Self::Three => Flux1SchnellNumImages::Three,
      Self::Four => Flux1SchnellNumImages::Four,
    }
  }

  pub fn to_edit(self) -> Flux1SchnellEditImageNumImages {
    match self {
      Self::One => Flux1SchnellEditImageNumImages::One,
      Self::Two => Flux1SchnellEditImageNumImages::Two,
      Self::Three => Flux1SchnellEditImageNumImages::Three,
      Self::Four => Flux1SchnellEditImageNumImages::Four,
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
