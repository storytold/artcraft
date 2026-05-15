use fal_client::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
use fal_client::requests::api::image::edit::gpt_image_2_edit_image::api::{
  GptImage2EditImageNumImages, GptImage2EditImageQuality, GptImage2EditImageRequest,
  GptImage2EditImageSize,
};
use fal_client::requests::api::image::text::gpt_image_2_text_to_image::api::{
  GptImage2TextToImageNumImages, GptImage2TextToImageQuality,
  GptImage2TextToImageRequest, GptImage2TextToImageSize,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_quality::CommonQuality;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::fal::gpt_image_2::request::FalGptImage2RequestState;

pub fn build_fal_gpt_image_2(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let prompt = builder.prompt.clone().unwrap_or_default();
  let image_urls = resolve_image_urls(builder.image_inputs.clone())?;
  let num_images = plan_num_images(builder.image_batch_count, builder.request_mismatch_mitigation_strategy)?;
  let image_size = plan_image_size(builder.aspect_ratio);
  let resolution = plan_resolution(builder.resolution);
  let quality = plan_quality(builder.quality);

  let state = if image_urls.is_empty() {
    FalGptImage2RequestState::TextToImage(GptImage2TextToImageRequest {
      prompt,
      num_images: to_t2i_num_images(num_images),
      image_size: image_size.and_then(to_t2i_image_size),
      resolution,
      quality: Some(to_t2i_quality(quality)),
      output_format: None,
    })
  } else {
    FalGptImage2RequestState::EditImage(GptImage2EditImageRequest {
      prompt,
      image_urls,
      num_images: to_edit_num_images(num_images),
      mask_url: None,
      image_size: image_size.map(to_edit_image_size),
      resolution,
      quality: Some(to_edit_quality(quality)),
      output_format: None,
    })
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalGptImage2(state),
  ))
}

#[derive(Copy, Clone, Debug)]
enum PlannedNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
enum PlannedQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
enum PlannedImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
  Auto,
}

fn plan_num_images(
  count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<PlannedNumImages, ArtcraftRouterError> {
  let count = count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(PlannedNumImages::One),
    2 => Ok(PlannedNumImages::Two),
    3 => Ok(PlannedNumImages::Three),
    4 => Ok(PlannedNumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(PlannedNumImages::Four),
    },
  }
}

fn plan_quality(quality: Option<CommonQuality>) -> PlannedQuality {
  match quality {
    Some(CommonQuality::Low) => PlannedQuality::Low,
    Some(CommonQuality::Medium) => PlannedQuality::Medium,
    Some(CommonQuality::High) | None => PlannedQuality::High,
  }
}

fn plan_resolution(resolution: Option<CommonResolution>) -> Option<GptImage2Resolution> {
  resolution.map(|r| match r {
    CommonResolution::HalfK
    | CommonResolution::FourEightyP
    | CommonResolution::SevenTwentyP
    | CommonResolution::OneK => GptImage2Resolution::OneK,
    CommonResolution::TenEightyP | CommonResolution::TwoK => GptImage2Resolution::TwoK,
    CommonResolution::ThreeK => GptImage2Resolution::ThreeK,
    CommonResolution::FourK => GptImage2Resolution::FourK,
  })
}

fn plan_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<PlannedImageSize> {
  match aspect_ratio {
    None => None,
    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => Some(PlannedImageSize::Auto),
    Some(CommonAspectRatio::Square) => Some(PlannedImageSize::Square),
    Some(CommonAspectRatio::SquareHd) => Some(PlannedImageSize::SquareHd),
    Some(CommonAspectRatio::WideFourByThree)
    | Some(CommonAspectRatio::WideFiveByFour) => Some(PlannedImageSize::Landscape4x3),
    Some(CommonAspectRatio::WideThreeByTwo)
    | Some(CommonAspectRatio::WideSixteenByNine)
    | Some(CommonAspectRatio::WideTwentyOneByNine)
    | Some(CommonAspectRatio::Wide) => Some(PlannedImageSize::Landscape16x9),
    Some(CommonAspectRatio::TallThreeByFour)
    | Some(CommonAspectRatio::TallFourByFive) => Some(PlannedImageSize::Portrait4x3),
    Some(CommonAspectRatio::TallTwoByThree)
    | Some(CommonAspectRatio::TallNineBySixteen)
    | Some(CommonAspectRatio::TallNineByTwentyOne)
    | Some(CommonAspectRatio::Tall) => Some(PlannedImageSize::Portrait16x9),
  }
}

fn to_t2i_num_images(n: PlannedNumImages) -> GptImage2TextToImageNumImages {
  match n {
    PlannedNumImages::One => GptImage2TextToImageNumImages::One,
    PlannedNumImages::Two => GptImage2TextToImageNumImages::Two,
    PlannedNumImages::Three => GptImage2TextToImageNumImages::Three,
    PlannedNumImages::Four => GptImage2TextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: PlannedNumImages) -> GptImage2EditImageNumImages {
  match n {
    PlannedNumImages::One => GptImage2EditImageNumImages::One,
    PlannedNumImages::Two => GptImage2EditImageNumImages::Two,
    PlannedNumImages::Three => GptImage2EditImageNumImages::Three,
    PlannedNumImages::Four => GptImage2EditImageNumImages::Four,
  }
}

fn to_t2i_quality(q: PlannedQuality) -> GptImage2TextToImageQuality {
  match q {
    PlannedQuality::Low => GptImage2TextToImageQuality::Low,
    PlannedQuality::Medium => GptImage2TextToImageQuality::Medium,
    PlannedQuality::High => GptImage2TextToImageQuality::High,
  }
}

fn to_edit_quality(q: PlannedQuality) -> GptImage2EditImageQuality {
  match q {
    PlannedQuality::Low => GptImage2EditImageQuality::Low,
    PlannedQuality::Medium => GptImage2EditImageQuality::Medium,
    PlannedQuality::High => GptImage2EditImageQuality::High,
  }
}

fn to_t2i_image_size(s: PlannedImageSize) -> Option<GptImage2TextToImageSize> {
  match s {
    PlannedImageSize::SquareHd => Some(GptImage2TextToImageSize::SquareHd),
    PlannedImageSize::Square => Some(GptImage2TextToImageSize::Square),
    PlannedImageSize::Portrait4x3 => Some(GptImage2TextToImageSize::Portrait4x3),
    PlannedImageSize::Portrait16x9 => Some(GptImage2TextToImageSize::Portrait16x9),
    PlannedImageSize::Landscape4x3 => Some(GptImage2TextToImageSize::Landscape4x3),
    PlannedImageSize::Landscape16x9 => Some(GptImage2TextToImageSize::Landscape16x9),
    PlannedImageSize::Auto => None,
  }
}

fn to_edit_image_size(s: PlannedImageSize) -> GptImage2EditImageSize {
  match s {
    PlannedImageSize::SquareHd => GptImage2EditImageSize::SquareHd,
    PlannedImageSize::Square => GptImage2EditImageSize::Square,
    PlannedImageSize::Portrait4x3 => GptImage2EditImageSize::Portrait4x3,
    PlannedImageSize::Portrait16x9 => GptImage2EditImageSize::Portrait16x9,
    PlannedImageSize::Landscape4x3 => GptImage2EditImageSize::Landscape4x3,
    PlannedImageSize::Landscape16x9 => GptImage2EditImageSize::Landscape16x9,
    PlannedImageSize::Auto => GptImage2EditImageSize::Auto,
  }
}

fn resolve_image_urls(
  image_inputs: Option<ImageListRef>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match image_inputs {
    None => Ok(vec![]),
    Some(ImageListRef::Urls(urls)) => Ok(urls),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}
