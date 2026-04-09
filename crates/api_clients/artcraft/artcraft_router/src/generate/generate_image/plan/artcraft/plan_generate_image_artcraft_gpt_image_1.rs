use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{
  GptImage1EditImageImageQuality, GptImage1EditImageImageSize, GptImage1EditImageNumImages,
};
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::{
  GenerateGptImage1TextToImageImageQuality, GenerateGptImage1TextToImageImageSize,
  GenerateGptImage1TextToImageNumImages,
};
use tokens::tokens::media_files::MediaFileToken;

/// Quality is shared between t2i and edit (Auto / Low / Medium / High).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArtcraftGptImage1Quality {
  Auto,
  Low,
  Medium,
  High,
}

/// Image size is shared between t2i and edit (Square / Horizontal / Vertical).
/// GPT Image 1 has no native auto size — None means "let the legacy handler
/// pick its default" (which is Square).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArtcraftGptImage1Size {
  Square,
  Horizontal,
  Vertical,
}

#[derive(Debug, Clone, Copy)]
pub enum ArtcraftGptImage1NumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Debug, Clone)]
pub struct PlanArtcraftGptImage1<'a> {
  pub prompt: Option<&'a str>,
  /// Input images for image editing. None means text-to-image mode.
  pub image_inputs: Option<&'a Vec<MediaFileToken>>,
  pub image_size: Option<ArtcraftGptImage1Size>,
  /// Quality defaults to High when the request leaves it unspecified, matching
  /// the legacy storyteller-web handler defaults.
  pub quality: ArtcraftGptImage1Quality,
  pub num_images: ArtcraftGptImage1NumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_gpt_image_1<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let image_inputs = resolve_image_list_ref(request.image_inputs)?;
  let image_size = plan_image_size(request.aspect_ratio);
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::ArtcraftGptImage1(PlanArtcraftGptImage1 {
    prompt: request.prompt,
    image_inputs,
    image_size,
    // Match the legacy handler default of High for both modes.
    quality: ArtcraftGptImage1Quality::High,
    num_images,
    idempotency_token: request.get_or_generate_idempotency_token(),
  }))
}

fn resolve_image_list_ref<'a>(
  image_list_ref: Option<ImageListRef<'a>>,
) -> Result<Option<&'a Vec<MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    // Omni-gen distillation hydrates media tokens to URLs before running the
    // Artcraft cost path. Cost only depends on quality + size + num_images +
    // is_edit_mode (derived before this resolver runs), so URL-form inputs are
    // accepted and dropped.
    Some(ImageListRef::Urls(_)) => Ok(None),
  }
}

// GPT Image 1 image sizes: Square (1024x1024), Horizontal (1536x1024),
// Vertical (1024x1536). All 17 CommonAspectRatio variants map to one of these
// or None (let the legacy handler default to Square).
fn plan_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<ArtcraftGptImage1Size> {
  use ArtcraftGptImage1Size as S;
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

// GPT Image 1 supports 1, 2, 3, and 4 images.
fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<ArtcraftGptImage1NumImages, ArtcraftRouterError> {
  use ArtcraftGptImage1NumImages as N;
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

// ── Conversions to legacy storyteller-web request enums ────────────────────

impl ArtcraftGptImage1NumImages {
  pub fn to_t2i(self) -> GenerateGptImage1TextToImageNumImages {
    use GenerateGptImage1TextToImageNumImages as T;
    match self {
      Self::One => T::One,
      Self::Two => T::Two,
      Self::Three => T::Three,
      Self::Four => T::Four,
    }
  }

  pub fn to_edit(self) -> GptImage1EditImageNumImages {
    use GptImage1EditImageNumImages as E;
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

impl ArtcraftGptImage1Quality {
  pub fn to_t2i(self) -> GenerateGptImage1TextToImageImageQuality {
    use GenerateGptImage1TextToImageImageQuality as T;
    match self {
      Self::Auto => T::Auto,
      Self::Low => T::Low,
      Self::Medium => T::Medium,
      Self::High => T::High,
    }
  }

  pub fn to_edit(self) -> GptImage1EditImageImageQuality {
    use GptImage1EditImageImageQuality as E;
    match self {
      Self::Auto => E::Auto,
      Self::Low => E::Low,
      Self::Medium => E::Medium,
      Self::High => E::High,
    }
  }
}

impl ArtcraftGptImage1Size {
  pub fn to_t2i(self) -> GenerateGptImage1TextToImageImageSize {
    use GenerateGptImage1TextToImageImageSize as T;
    match self {
      Self::Square => T::Square,
      Self::Horizontal => T::Horizontal,
      Self::Vertical => T::Vertical,
    }
  }

  pub fn to_edit(self) -> GptImage1EditImageImageSize {
    use GptImage1EditImageImageSize as E;
    match self {
      Self::Square => E::Square,
      Self::Horizontal => E::Horizontal,
      Self::Vertical => E::Vertical,
    }
  }
}
