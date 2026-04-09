use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::edit::enqueue_gpt_image_1_edit_image_webhook::{
  EnqueueGptImage1EditImageNumImages, EnqueueGptImage1EditImageQuality,
  EnqueueGptImage1EditImageSize,
};
use fal_client::requests::webhook::image::text::enqueue_gpt_image_1_text_to_image_webhook::{
  EnqueueGptImage1TextToImageNumImages, EnqueueGptImage1TextToImageQuality,
  EnqueueGptImage1TextToImageSize,
};

#[derive(Debug, Clone, Copy)]
pub enum FalGptImage1NumImages {
  One,
  Two,
  Three,
  Four,
}

/// Quality is shared between t2i and edit (Low / Medium / High).
#[derive(Debug, Clone, Copy)]
pub enum FalGptImage1Quality {
  Low,
  Medium,
  High,
}

/// GPT Image 1 supports three image sizes: 1024x1024, 1536x1024, 1024x1536.
#[derive(Debug, Clone, Copy)]
pub enum FalGptImage1ImageSize {
  Square,
  Horizontal,
  Vertical,
}

#[derive(Debug, Clone)]
pub struct PlanFalGptImage1<'a> {
  pub prompt: Option<&'a str>,
  /// Image URLs for editing. Empty vec = text-to-image mode.
  pub image_urls: Vec<String>,
  pub image_size: Option<FalGptImage1ImageSize>,
  /// Quality defaults to Medium when the request leaves it unspecified.
  /// (Matches the fal cost calculator default.)
  pub quality: FalGptImage1Quality,
  pub num_images: FalGptImage1NumImages,
}

pub fn plan_generate_image_fal_gpt_image_1<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let image_urls = resolve_image_list_ref(request.image_inputs)?;
  let image_size = plan_image_size(request.aspect_ratio);
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalGptImage1(PlanFalGptImage1 {
    prompt: request.prompt,
    image_urls,
    image_size,
    quality: FalGptImage1Quality::Medium,
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

fn plan_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<FalGptImage1ImageSize> {
  use FalGptImage1ImageSize as S;
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => None,

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Some(S::Square),

    Some(CommonAspectRatio::WideThreeByTwo)
    | Some(CommonAspectRatio::WideFourByThree)
    | Some(CommonAspectRatio::WideFiveByFour)
    | Some(CommonAspectRatio::WideSixteenByNine)
    | Some(CommonAspectRatio::WideTwentyOneByNine)
    | Some(CommonAspectRatio::Wide) => Some(S::Horizontal),

    Some(CommonAspectRatio::TallTwoByThree)
    | Some(CommonAspectRatio::TallThreeByFour)
    | Some(CommonAspectRatio::TallFourByFive)
    | Some(CommonAspectRatio::TallNineBySixteen)
    | Some(CommonAspectRatio::TallNineByTwentyOne)
    | Some(CommonAspectRatio::Tall) => Some(S::Vertical),
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalGptImage1NumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalGptImage1NumImages::One),
    2 => Ok(FalGptImage1NumImages::Two),
    3 => Ok(FalGptImage1NumImages::Three),
    4 => Ok(FalGptImage1NumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(FalGptImage1NumImages::Four),
    },
  }
}

// ── Conversions to fal-client enqueue enums ────────────────────────────────

impl FalGptImage1NumImages {
  pub fn to_t2i(self) -> EnqueueGptImage1TextToImageNumImages {
    use EnqueueGptImage1TextToImageNumImages as T;
    match self {
      Self::One => T::One,
      Self::Two => T::Two,
      Self::Three => T::Three,
      Self::Four => T::Four,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage1EditImageNumImages {
    use EnqueueGptImage1EditImageNumImages as E;
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

impl FalGptImage1Quality {
  pub fn to_t2i(self) -> EnqueueGptImage1TextToImageQuality {
    use EnqueueGptImage1TextToImageQuality as T;
    match self {
      Self::Low => T::Low,
      Self::Medium => T::Medium,
      Self::High => T::High,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage1EditImageQuality {
    use EnqueueGptImage1EditImageQuality as E;
    match self {
      Self::Low => E::Low,
      Self::Medium => E::Medium,
      Self::High => E::High,
    }
  }
}

impl FalGptImage1ImageSize {
  pub fn to_t2i(self) -> EnqueueGptImage1TextToImageSize {
    use EnqueueGptImage1TextToImageSize as T;
    match self {
      Self::Square => T::Square,
      Self::Horizontal => T::Horizontal,
      Self::Vertical => T::Vertical,
    }
  }

  pub fn to_edit(self) -> EnqueueGptImage1EditImageSize {
    use EnqueueGptImage1EditImageSize as E;
    match self {
      Self::Square => E::Square,
      Self::Horizontal => E::Horizontal,
      Self::Vertical => E::Vertical,
    }
  }
}
