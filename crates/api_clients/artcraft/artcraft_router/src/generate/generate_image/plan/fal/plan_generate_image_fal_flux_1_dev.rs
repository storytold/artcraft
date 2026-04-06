use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::edit::enqueue_flux_1_dev_edit_image_webhook::Flux1DevEditImageNumImages;
use fal_client::requests::webhook::image::text::enqueue_flux_1_dev_text_to_image_webhook::{
  Flux1DevAspectRatio, Flux1DevNumImages,
};

/// Shared num-images type for both t2i and edit modes.
#[derive(Debug, Clone, Copy)]
pub enum FalFlux1DevNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Debug, Clone)]
pub struct PlanFalFlux1Dev<'a> {
  pub prompt: Option<&'a str>,
  /// Image URL for editing. None = text-to-image mode.
  pub maybe_image_url: Option<String>,
  pub aspect_ratio: Flux1DevAspectRatio,
  pub num_images: FalFlux1DevNumImages,
}

pub fn plan_generate_image_fal_flux_1_dev<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let maybe_image_url = resolve_single_image_url(request.image_inputs)?;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalFlux1Dev(PlanFalFlux1Dev {
    prompt: request.prompt,
    maybe_image_url,
    aspect_ratio,
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
          value: format!("Flux 1 Dev image-to-image supports exactly 1 image, got {}", urls.len()),
        }))
      }
    }
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Flux1DevAspectRatio, ArtcraftRouterError> {
  use Flux1DevAspectRatio as Ar;
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
) -> Result<FalFlux1DevNumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalFlux1DevNumImages::One),
    2 => Ok(FalFlux1DevNumImages::Two),
    3 => Ok(FalFlux1DevNumImages::Three),
    4 => Ok(FalFlux1DevNumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FalFlux1DevNumImages::Four),
    },
  }
}

impl FalFlux1DevNumImages {
  pub fn to_t2i(self) -> Flux1DevNumImages {
    match self {
      Self::One => Flux1DevNumImages::One,
      Self::Two => Flux1DevNumImages::Two,
      Self::Three => Flux1DevNumImages::Three,
      Self::Four => Flux1DevNumImages::Four,
    }
  }

  pub fn to_edit(self) -> Flux1DevEditImageNumImages {
    match self {
      Self::One => Flux1DevEditImageNumImages::One,
      Self::Two => Flux1DevEditImageNumImages::Two,
      Self::Three => Flux1DevEditImageNumImages::Three,
      Self::Four => Flux1DevEditImageNumImages::Four,
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
