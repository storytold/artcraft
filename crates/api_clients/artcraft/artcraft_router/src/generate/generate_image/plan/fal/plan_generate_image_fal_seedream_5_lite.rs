use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v5_lite_edit_image_webhook::{
  EnqueueBytedanceSeedreamV5LiteEditImageNumImages, EnqueueBytedanceSeedreamV5LiteEditImageSize,
};
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v5_lite_text_to_image_webhook::{
  EnqueueBytedanceSeedreamV5LiteTextToImageNumImages, EnqueueBytedanceSeedreamV5LiteTextToImageSize,
};

#[derive(Debug, Clone, Copy)]
pub enum FalSeedream5LiteNumImages {
  One,
  Two,
  Three,
  Four,
}

/// Note: Seedream V5 Lite supports Auto2k and Auto3k (no 4K, no bare Auto).
#[derive(Debug, Clone, Copy)]
pub enum FalSeedream5LiteImageSize {
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
  Auto2k,
  Auto3k,
}

#[derive(Debug, Clone)]
pub struct PlanFalSeedream5Lite<'a> {
  pub prompt: Option<&'a str>,
  pub image_urls: Vec<String>,
  pub image_size: Option<FalSeedream5LiteImageSize>,
  pub num_images: FalSeedream5LiteNumImages,
}

pub fn plan_generate_image_fal_seedream_5_lite<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let image_urls = resolve_image_list_ref(request.image_inputs)?;
  let image_size = plan_image_size(request.aspect_ratio, request.resolution, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalSeedream5Lite(PlanFalSeedream5Lite {
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
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<FalSeedream5LiteImageSize>, ArtcraftRouterError> {
  use FalSeedream5LiteImageSize as S;

  // Resolution-based auto sizes take precedence when an explicit Auto* aspect ratio
  // isn't specified but a resolution is — Seedream v5 lite has no 4K, fall back to 3K.
  match aspect_ratio {
    None => match resolution {
      Some(CommonResolution::TwoK) => Ok(Some(S::Auto2k)),
      Some(CommonResolution::ThreeK) | Some(CommonResolution::FourK) => Ok(Some(S::Auto3k)),
      _ => Ok(None),
    },

    Some(CommonAspectRatio::Auto) | Some(CommonAspectRatio::Auto2k) => Ok(Some(S::Auto2k)),
    // No 4K — fall back to 3K.
    Some(CommonAspectRatio::Auto4k) => Ok(Some(S::Auto3k)),

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
) -> Result<FalSeedream5LiteNumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalSeedream5LiteNumImages::One),
    2 => Ok(FalSeedream5LiteNumImages::Two),
    3 => Ok(FalSeedream5LiteNumImages::Three),
    4 => Ok(FalSeedream5LiteNumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FalSeedream5LiteNumImages::Four),
    },
  }
}

impl FalSeedream5LiteNumImages {
  pub fn to_t2i(self) -> EnqueueBytedanceSeedreamV5LiteTextToImageNumImages {
    use EnqueueBytedanceSeedreamV5LiteTextToImageNumImages as T;
    match self {
      Self::One => T::One,
      Self::Two => T::Two,
      Self::Three => T::Three,
      Self::Four => T::Four,
    }
  }

  pub fn to_edit(self) -> EnqueueBytedanceSeedreamV5LiteEditImageNumImages {
    use EnqueueBytedanceSeedreamV5LiteEditImageNumImages as E;
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

impl FalSeedream5LiteImageSize {
  pub fn to_t2i(self) -> EnqueueBytedanceSeedreamV5LiteTextToImageSize {
    use EnqueueBytedanceSeedreamV5LiteTextToImageSize as T;
    match self {
      Self::Square => T::Square,
      Self::SquareHd => T::SquareHd,
      Self::PortraitFourThree => T::PortraitFourThree,
      Self::PortraitSixteenNine => T::PortraitSixteenNine,
      Self::LandscapeFourThree => T::LandscapeFourThree,
      Self::LandscapeSixteenNine => T::LandscapeSixteenNine,
      Self::Auto2k => T::Auto2k,
      Self::Auto3k => T::Auto3k,
    }
  }

  pub fn to_edit(self) -> EnqueueBytedanceSeedreamV5LiteEditImageSize {
    use EnqueueBytedanceSeedreamV5LiteEditImageSize as E;
    match self {
      Self::Square => E::Square,
      Self::SquareHd => E::SquareHd,
      Self::PortraitFourThree => E::PortraitFourThree,
      Self::PortraitSixteenNine => E::PortraitSixteenNine,
      Self::LandscapeFourThree => E::LandscapeFourThree,
      Self::LandscapeSixteenNine => E::LandscapeSixteenNine,
      Self::Auto2k => E::Auto2k,
      Self::Auto3k => E::Auto3k,
    }
  }
}
