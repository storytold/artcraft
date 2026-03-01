use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonVideoResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use artcraft_api_defs::generate::image::multi_function::nano_banana_pro_multi_function_image_gen::{
  NanoBananaProMultiFunctionImageGenAspectRatio, NanoBananaProMultiFunctionImageGenImageResolution,
  NanoBananaProMultiFunctionImageGenNumImages,
};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Debug, Clone)]
pub struct PlanArtcraftNanaBananaPro<'a> {
  pub prompt: Option<&'a str>,
  /// Input images for image editing. None means text-to-image mode.
  pub image_inputs: Option<&'a Vec<MediaFileToken>>,
  pub aspect_ratio: Option<NanoBananaProMultiFunctionImageGenAspectRatio>,
  pub resolution: Option<NanoBananaProMultiFunctionImageGenImageResolution>,
  pub num_images: NanoBananaProMultiFunctionImageGenNumImages,
  pub idempotency_token: String,
}

pub fn plan_generate_image_artcraft_nano_banana_pro<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<PlanArtcraftNanaBananaPro<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;

  let is_edit_mode = request.image_inputs.is_some();
  let image_inputs = resolve_image_list_ref(request.image_inputs)?;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, is_edit_mode, strategy)?;
  let resolution = plan_resolution(request.resolution, strategy)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(PlanArtcraftNanaBananaPro {
    prompt: request.prompt,
    image_inputs,
    aspect_ratio,
    resolution,
    num_images,
    idempotency_token: request.get_or_generate_idempotency_token(),
  })
}

fn resolve_image_list_ref<'a>(
  image_list_ref: Option<ImageListRef<'a>>,
) -> Result<Option<&'a Vec<MediaFileToken>>, ArtcraftRouterError> {
  match image_list_ref {
    None => Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => Ok(Some(tokens)),
    Some(ImageListRef::Urls(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    }
  }
}

// Nano Banana Pro supported aspect ratios:
//   Text-to-image: OneByOne, FiveByFour, FourByThree, ThreeByTwo, SixteenByNine, TwentyOneByNine,
//                  FourByFive, ThreeByFour, TwoByThree, NineBySixteen
//   Image editing: Auto (uses source image AR), plus all text-to-image ratios
fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  is_edit_mode: bool,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<NanoBananaProMultiFunctionImageGenAspectRatio>, ArtcraftRouterError> {
  use NanoBananaProMultiFunctionImageGenAspectRatio as NbpAr;
  match aspect_ratio {
    // No preference — let the model use its default
    None => Ok(None),

    // Auto: only valid in edit mode (use source image dimensions)
    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => {
      if is_edit_mode {
        Ok(Some(NbpAr::Auto))
      } else {
        // Auto not valid for text-to-image; fall back to square default
        Ok(Some(NbpAr::OneByOne))
      }
    }

    // Direct mappings
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(NbpAr::OneByOne)),
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(NbpAr::FiveByFour)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(NbpAr::FourByThree)),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(NbpAr::ThreeByTwo)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(NbpAr::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(NbpAr::TwentyOneByNine)),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Some(NbpAr::FourByFive)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(NbpAr::ThreeByFour)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(NbpAr::TwoByThree)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(NbpAr::NineBySixteen)),

    // Mismatch — TallNineByTwentyOne has no direct equivalent
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(nearest_aspect_ratio(unsupported)))
      }
    },
  }
}

/// Pick the nearest supported aspect ratio for unsupported inputs.
fn nearest_aspect_ratio(aspect_ratio: CommonAspectRatio) -> NanoBananaProMultiFunctionImageGenAspectRatio {
  use NanoBananaProMultiFunctionImageGenAspectRatio as NbpAr;
  match aspect_ratio {
    // TallNineByTwentyOne (0.43) — nearest is NineBySixteen (0.5625)
    CommonAspectRatio::TallNineByTwentyOne => NbpAr::NineBySixteen,
    _ => NbpAr::OneByOne,
  }
}

fn plan_resolution(
  resolution: Option<CommonVideoResolution>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<NanoBananaProMultiFunctionImageGenImageResolution>, ArtcraftRouterError> {
  use CommonVideoResolution as R;
  use NanoBananaProMultiFunctionImageGenImageResolution as NbpRes;
  match resolution {
    None => Ok(None),
    Some(R::OneK) => Ok(Some(NbpRes::OneK)),
    Some(R::TwoK) => Ok(Some(NbpRes::TwoK)),
    Some(R::FourK) => Ok(Some(NbpRes::FourK)),
    Some(R::ThreeK) => {
      // No 3K option; default to 2K
      Ok(Some(NbpRes::TwoK))
    }
  }
}

// Nano Banana Pro supports 1, 2, 3, and 4 images.
fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<NanoBananaProMultiFunctionImageGenNumImages, ArtcraftRouterError> {
  use NanoBananaProMultiFunctionImageGenNumImages as NbpN;
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(NbpN::One),
    2 => Ok(NbpN::Two),
    3 => Ok(NbpN::Three),
    4 => Ok(NbpN::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(NbpN::Four),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(NbpN::Four),
    },
  }
}
