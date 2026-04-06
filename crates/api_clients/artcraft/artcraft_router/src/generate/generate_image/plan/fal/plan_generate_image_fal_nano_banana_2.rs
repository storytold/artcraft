use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
use crate::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use fal_client::requests::webhook::image::edit::enqueue_nano_banana_2_edit_image_webhook::EnqueueNanoBanana2EditImageAspectRatio;
use fal_client::requests::webhook::image::text::enqueue_nano_banana_2_text_to_image_webhook::EnqueueNanoBanana2TextToImageAspectRatio;

/// Intermediate resolution type shared between t2i and edit enums.
#[derive(Debug, Clone, Copy)]
pub enum FalNb2Resolution {
  HalfK,
  OneK,
  TwoK,
  FourK,
}

/// Intermediate num-images type shared between t2i and edit enums.
#[derive(Debug, Clone, Copy)]
pub enum FalNb2NumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Debug, Clone)]
pub struct PlanFalNanaBanana2<'a> {
  pub prompt: Option<&'a str>,
  /// Image URLs for editing. Empty vec = text-to-image mode.
  pub image_urls: Vec<String>,
  /// Pre-resolved aspect ratio for text-to-image mode.
  pub t2i_aspect_ratio: Option<EnqueueNanoBanana2TextToImageAspectRatio>,
  /// Pre-resolved aspect ratio for image-edit mode.
  pub edit_aspect_ratio: Option<EnqueueNanoBanana2EditImageAspectRatio>,
  /// Pre-resolved resolution (shared for both modes).
  pub resolution: Option<FalNb2Resolution>,
  /// Pre-resolved number of images (1–4, shared for both modes).
  pub num_images: FalNb2NumImages,
}

pub fn plan_generate_image_fal_nano_banana_2<'a>(
  request: &'a GenerateImageRequest<'a>,
) -> Result<ImageGenerationPlan<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let is_edit_mode = request.image_inputs.is_some();
  let image_urls = resolve_image_list_ref(request.image_inputs)?;
  let t2i_aspect_ratio = plan_t2i_aspect_ratio(request.aspect_ratio, strategy)?;
  let edit_aspect_ratio = plan_edit_aspect_ratio(request.aspect_ratio, is_edit_mode, strategy)?;
  let resolution = plan_resolution(request.resolution)?;
  let num_images = plan_num_images(request.image_batch_count, strategy)?;

  Ok(ImageGenerationPlan::FalNanaBanana2(PlanFalNanaBanana2 {
    prompt: request.prompt,
    image_urls,
    t2i_aspect_ratio,
    edit_aspect_ratio,
    resolution,
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

// NB2 text-to-image supported aspect ratios:
//   auto, 1:1, 5:4, 4:3, 3:2, 16:9, 21:9, 4:5, 3:4, 2:3, 9:16
fn plan_t2i_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<EnqueueNanoBanana2TextToImageAspectRatio>, ArtcraftRouterError> {
  use EnqueueNanoBanana2TextToImageAspectRatio as T2iAr;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(T2iAr::Auto)),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(T2iAr::OneByOne)),
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(T2iAr::FiveByFour)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(T2iAr::FourByThree)),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(T2iAr::ThreeByTwo)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(T2iAr::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(T2iAr::TwentyOneByNine)),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Some(T2iAr::FourByFive)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(T2iAr::ThreeByFour)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(T2iAr::TwoByThree)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(T2iAr::NineBySixteen)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(T2iAr::NineBySixteen))
      }
    },
  }
}

// NB2 image-edit supported aspect ratios: same as t2i plus Auto
fn plan_edit_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  is_edit_mode: bool,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<EnqueueNanoBanana2EditImageAspectRatio>, ArtcraftRouterError> {
  use EnqueueNanoBanana2EditImageAspectRatio as EditAr;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => {
      if is_edit_mode {
        Ok(Some(EditAr::Auto))
      } else {
        Ok(Some(EditAr::OneByOne))
      }
    }

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(EditAr::OneByOne)),
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(EditAr::FiveByFour)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(EditAr::FourByThree)),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(EditAr::ThreeByTwo)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(EditAr::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(EditAr::TwentyOneByNine)),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Some(EditAr::FourByFive)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(EditAr::ThreeByFour)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(EditAr::TwoByThree)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(EditAr::NineBySixteen)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(EditAr::NineBySixteen))
      }
    },
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
) -> Result<Option<FalNb2Resolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),
    Some(CommonResolution::HalfK) => Ok(Some(FalNb2Resolution::HalfK)),
    Some(CommonResolution::OneK) => Ok(Some(FalNb2Resolution::OneK)),
    Some(CommonResolution::TwoK) => Ok(Some(FalNb2Resolution::TwoK)),
    Some(CommonResolution::FourK) => Ok(Some(FalNb2Resolution::FourK)),
    Some(CommonResolution::ThreeK) => Ok(Some(FalNb2Resolution::TwoK)),
    Some(CommonResolution::FourEightyP) => Ok(Some(FalNb2Resolution::HalfK)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(FalNb2Resolution::OneK)),
    Some(CommonResolution::TenEightyP) => Ok(Some(FalNb2Resolution::OneK)),
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<FalNb2NumImages, ArtcraftRouterError> {
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(FalNb2NumImages::One),
    2 => Ok(FalNb2NumImages::Two),
    3 => Ok(FalNb2NumImages::Three),
    4 => Ok(FalNb2NumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade
      | RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(FalNb2NumImages::Four),
    },
  }
}
