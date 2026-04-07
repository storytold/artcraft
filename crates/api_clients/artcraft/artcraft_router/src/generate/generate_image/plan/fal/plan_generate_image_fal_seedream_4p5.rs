use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v4p5_edit_image_webhook::{
  EnqueueBytedanceSeedreamV4p5EditImageNumImages, EnqueueBytedanceSeedreamV4p5EditImageSize,
};
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v4p5_text_to_image_webhook::{
  EnqueueBytedanceSeedreamV4p5TextToImageNumImages, EnqueueBytedanceSeedreamV4p5TextToImageSize,
};

#[derive(Debug, Clone, Copy)]
pub enum FalSeedream4p5NumImages {
  One,
  Two,
  Three,
  Four,
}

/// Note: Seedream V4.5 lacks the bare "Auto" image_size; only Auto2k/Auto4k are supported.
#[derive(Debug, Clone, Copy)]
pub enum FalSeedream4p5ImageSize {
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
  Auto2k,
  Auto4k,
}

#[derive(Debug, Clone)]
pub struct PlanFalSeedream4p5<'a> {
  pub prompt: Option<&'a str>,
  pub image_urls: Vec<String>,
  pub image_size: Option<FalSeedream4p5ImageSize>,
  pub num_images: FalSeedream4p5NumImages,
}

pub fn plan_generate_image_fal_seedream_4p5<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let image_urls = resolve_image_list_ref(request.image_inputs)?;
  let image_size = plan_image_size(request.aspect_ratio, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalSeedream4p5(PlanFalSeedream4p5 {
    prompt: request.prompt,
    image_urls,
    image_size,
    num_images,
  }))
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

fn plan_image_size(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSeedream4p5ImageSize>, ArtcraftRouterError> {
  use FalSeedream4p5ImageSize as S;
  match aspect_ratio {
    None => Ok(None),

    // No bare Auto for v4.5 — fall back to Auto2k.
    Some(CommonAspectRatio::Auto) | Some(CommonAspectRatio::Auto2k) => Ok(Some(S::Auto2k)),
    Some(CommonAspectRatio::Auto4k) => Ok(Some(S::Auto4k)),

    Some(CommonAspectRatio::Square) => Ok(Some(S::Square)),
    Some(CommonAspectRatio::SquareHd) => Ok(Some(S::SquareHd)),

    Some(CommonAspectRatio::Wide) | Some(CommonAspectRatio::WideSixteenByNine) => Ok(Some(S::LandscapeSixteenNine)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(S::LandscapeFourThree)),

    Some(unsupported @ CommonAspectRatio::WideFiveByFour)
    | Some(unsupported @ CommonAspectRatio::WideThreeByTwo)
    | Some(unsupported @ CommonAspectRatio::WideTwentyOneByNine) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(S::LandscapeSixteenNine)),
    },

    Some(CommonAspectRatio::Tall) | Some(CommonAspectRatio::TallNineBySixteen) => Ok(Some(S::PortraitSixteenNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(S::PortraitFourThree)),

    Some(unsupported @ CommonAspectRatio::TallFourByFive)
    | Some(unsupported @ CommonAspectRatio::TallTwoByThree)
    | Some(unsupported @ CommonAspectRatio::TallNineByTwentyOne) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(S::PortraitSixteenNine)),
    },
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalSeedream4p5NumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalSeedream4p5NumImages::One),
    2 => Ok(FalSeedream4p5NumImages::Two),
    3 => Ok(FalSeedream4p5NumImages::Three),
    4 => Ok(FalSeedream4p5NumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FalSeedream4p5NumImages::Four),
    },
  }
}

impl FalSeedream4p5NumImages {
  pub fn to_t2i(self) -> EnqueueBytedanceSeedreamV4p5TextToImageNumImages {
    use EnqueueBytedanceSeedreamV4p5TextToImageNumImages as T;
    match self {
      Self::One => T::One,
      Self::Two => T::Two,
      Self::Three => T::Three,
      Self::Four => T::Four,
    }
  }

  pub fn to_edit(self) -> EnqueueBytedanceSeedreamV4p5EditImageNumImages {
    use EnqueueBytedanceSeedreamV4p5EditImageNumImages as E;
    match self {
      Self::One => E::One,
      Self::Two => E::Two,
      Self::Three => E::Three,
      Self::Four => E::Four,
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

impl FalSeedream4p5ImageSize {
  pub fn to_t2i(self) -> EnqueueBytedanceSeedreamV4p5TextToImageSize {
    use EnqueueBytedanceSeedreamV4p5TextToImageSize as T;
    match self {
      Self::Square => T::Square,
      Self::SquareHd => T::SquareHd,
      Self::PortraitFourThree => T::PortraitFourThree,
      Self::PortraitSixteenNine => T::PortraitSixteenNine,
      Self::LandscapeFourThree => T::LandscapeFourThree,
      Self::LandscapeSixteenNine => T::LandscapeSixteenNine,
      Self::Auto2k => T::Auto2k,
      Self::Auto4k => T::Auto4k,
    }
  }

  pub fn to_edit(self) -> EnqueueBytedanceSeedreamV4p5EditImageSize {
    use EnqueueBytedanceSeedreamV4p5EditImageSize as E;
    match self {
      Self::Square => E::Square,
      Self::SquareHd => E::SquareHd,
      Self::PortraitFourThree => E::PortraitFourThree,
      Self::PortraitSixteenNine => E::PortraitSixteenNine,
      Self::LandscapeFourThree => E::LandscapeFourThree,
      Self::LandscapeSixteenNine => E::LandscapeSixteenNine,
      Self::Auto2k => E::Auto2k,
      Self::Auto4k => E::Auto4k,
    }
  }
}
