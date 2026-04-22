use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_quality::CommonQuality;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_2_edit_image_webhook::{
  EnqueueGptImage2EditImageNumImages, EnqueueGptImage2EditImageQuality,
  EnqueueGptImage2EditImageSize,
};
use fal_client::requests::webhook::image::text::enqueue_gpt_image_2_text_to_image_webhook::{
  EnqueueGptImage2TextToImageNumImages, EnqueueGptImage2TextToImageQuality,
  EnqueueGptImage2TextToImageSize,
};

#[derive(Debug, Clone, Copy)]
pub enum FalGptImage2NumImages {
  One,
  Two,
  Three,
  Four,
}

/// Quality is shared between t2i and edit (Low / Medium / High).
#[derive(Debug, Clone, Copy)]
pub enum FalGptImage2Quality {
  Low,
  Medium,
  High,
}

/// GPT Image 2 supports six image sizes.
#[derive(Debug, Clone, Copy)]
pub enum FalGptImage2ImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
}

#[derive(Debug, Clone)]
pub struct PlanFalGptImage2 {
  pub prompt: Option<String>,
  pub image_urls: Vec<String>,
  pub image_size: Option<FalGptImage2ImageSize>,
  pub quality: FalGptImage2Quality,
  pub num_images: FalGptImage2NumImages,
}

pub fn plan_generate_image_fal_gpt_image_2(
  request: &GenerateImageRequest,
) -> Result<ImageGenerationPlan, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let image_urls = resolve_image_list_ref(request.image_inputs.clone())?;
  let image_size = plan_image_size(request.aspect_ratio);
  let quality = plan_quality(request.quality);
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalGptImage2(PlanFalGptImage2 {
    prompt: request.prompt.clone(),
    image_urls,
    image_size,
    quality,
    num_images,
  }))
}

fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(vec![]),
    Some(ImageListRef::Urls(urls)) => Ok(urls.clone()),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn plan_quality(quality: Option<CommonQuality>) -> FalGptImage2Quality {
  match quality {
    Some(CommonQuality::Low) => FalGptImage2Quality::Low,
    Some(CommonQuality::Medium) => FalGptImage2Quality::Medium,
    Some(CommonQuality::High) => FalGptImage2Quality::High,
    None => FalGptImage2Quality::High,
  }
}

fn plan_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<FalGptImage2ImageSize> {
  use FalGptImage2ImageSize as S;
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => None,

    Some(CommonAspectRatio::Square) => Some(S::Square),
    Some(CommonAspectRatio::SquareHd) => Some(S::SquareHd),

    Some(CommonAspectRatio::WideFourByThree)
    | Some(CommonAspectRatio::WideFiveByFour) => Some(S::Landscape4x3),

    Some(CommonAspectRatio::WideThreeByTwo)
    | Some(CommonAspectRatio::WideSixteenByNine)
    | Some(CommonAspectRatio::WideTwentyOneByNine)
    | Some(CommonAspectRatio::Wide) => Some(S::Landscape16x9),

    Some(CommonAspectRatio::TallThreeByFour)
    | Some(CommonAspectRatio::TallFourByFive) => Some(S::Portrait4x3),

    Some(CommonAspectRatio::TallTwoByThree)
    | Some(CommonAspectRatio::TallNineBySixteen)
    | Some(CommonAspectRatio::TallNineByTwentyOne)
    | Some(CommonAspectRatio::Tall) => Some(S::Portrait16x9),
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalGptImage2NumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalGptImage2NumImages::One),
    2 => Ok(FalGptImage2NumImages::Two),
    3 => Ok(FalGptImage2NumImages::Three),
    4 => Ok(FalGptImage2NumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FalGptImage2NumImages::Four),
    },
  }
}

impl FalGptImage2NumImages {
  pub fn to_t2i(self) -> EnqueueGptImage2TextToImageNumImages {
    use EnqueueGptImage2TextToImageNumImages as T;
    match self {
      Self::One => T::One,
      Self::Two => T::Two,
      Self::Three => T::Three,
      Self::Four => T::Four,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage2EditImageNumImages {
    use EnqueueGptImage2EditImageNumImages as E;
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

impl FalGptImage2Quality {
  pub fn to_t2i(self) -> EnqueueGptImage2TextToImageQuality {
    use EnqueueGptImage2TextToImageQuality as T;
    match self {
      Self::Low => T::Low,
      Self::Medium => T::Medium,
      Self::High => T::High,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage2EditImageQuality {
    use EnqueueGptImage2EditImageQuality as E;
    match self {
      Self::Low => E::Low,
      Self::Medium => E::Medium,
      Self::High => E::High,
    }
  }
}

impl FalGptImage2ImageSize {
  pub fn to_t2i(self) -> EnqueueGptImage2TextToImageSize {
    use EnqueueGptImage2TextToImageSize as T;
    match self {
      Self::SquareHd => T::SquareHd,
      Self::Square => T::Square,
      Self::Portrait4x3 => T::Portrait4x3,
      Self::Portrait16x9 => T::Portrait16x9,
      Self::Landscape4x3 => T::Landscape4x3,
      Self::Landscape16x9 => T::Landscape16x9,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage2EditImageSize {
    use EnqueueGptImage2EditImageSize as E;
    match self {
      Self::SquareHd => E::SquareHd,
      Self::Square => E::Square,
      Self::Portrait4x3 => E::Portrait4x3,
      Self::Portrait16x9 => E::Portrait16x9,
      Self::Landscape4x3 => E::Landscape4x3,
      Self::Landscape16x9 => E::Landscape16x9,
    }
  }
}
