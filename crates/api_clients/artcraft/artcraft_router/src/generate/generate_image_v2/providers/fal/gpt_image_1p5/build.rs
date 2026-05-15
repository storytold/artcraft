use fal_client::requests::api::image::edit::gpt_image_1p5_edit_image::api::{
  GptImage1p5EditImageNumImages, GptImage1p5EditImageQuality,
  GptImage1p5EditImageRequest, GptImage1p5EditImageSize,
};
use fal_client::requests::api::image::text::gpt_image_1p5_text_to_image::api::{
  GptImage1p5TextToImageNumImages, GptImage1p5TextToImageQuality,
  GptImage1p5TextToImageRequest, GptImage1p5TextToImageSize,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_quality::CommonQuality;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1p5::request::FalGptImage1p5RequestState;

pub fn build_fal_gpt_image_1p5(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let prompt = builder.prompt.clone().unwrap_or_default();
  let image_urls = resolve_image_urls(builder.image_inputs.clone())?;
  let num_images = plan_num_images(builder.image_batch_count, builder.request_mismatch_mitigation_strategy)?;
  let image_size = plan_image_size(builder.aspect_ratio);
  let quality = plan_quality(builder.quality);

  let state = if image_urls.is_empty() {
    FalGptImage1p5RequestState::TextToImage(GptImage1p5TextToImageRequest {
      prompt,
      num_images: to_t2i_num_images(num_images),
      image_size: image_size.map(to_t2i_image_size),
      background: None,
      quality: Some(to_t2i_quality(quality)),
      output_format: None,
    })
  } else {
    FalGptImage1p5RequestState::EditImage(GptImage1p5EditImageRequest {
      prompt,
      image_urls,
      num_images: to_edit_num_images(num_images),
      mask_image_url: None,
      image_size: image_size.map(to_edit_image_size),
      background: None,
      quality: Some(to_edit_quality(quality)),
      input_fidelity: None,
      output_format: None,
    })
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalGptImage1p5(state),
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
  Square,
  Wide,
  Tall,
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

fn plan_image_size(aspect_ratio: Option<CommonAspectRatio>) -> Option<PlannedImageSize> {
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => None,
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Some(PlannedImageSize::Square)
    }
    Some(CommonAspectRatio::WideThreeByTwo)
    | Some(CommonAspectRatio::WideFourByThree)
    | Some(CommonAspectRatio::WideFiveByFour)
    | Some(CommonAspectRatio::WideSixteenByNine)
    | Some(CommonAspectRatio::WideTwentyOneByNine)
    | Some(CommonAspectRatio::Wide) => Some(PlannedImageSize::Wide),
    Some(CommonAspectRatio::TallTwoByThree)
    | Some(CommonAspectRatio::TallThreeByFour)
    | Some(CommonAspectRatio::TallFourByFive)
    | Some(CommonAspectRatio::TallNineBySixteen)
    | Some(CommonAspectRatio::TallNineByTwentyOne)
    | Some(CommonAspectRatio::Tall) => Some(PlannedImageSize::Tall),
  }
}

fn to_t2i_num_images(n: PlannedNumImages) -> GptImage1p5TextToImageNumImages {
  match n {
    PlannedNumImages::One => GptImage1p5TextToImageNumImages::One,
    PlannedNumImages::Two => GptImage1p5TextToImageNumImages::Two,
    PlannedNumImages::Three => GptImage1p5TextToImageNumImages::Three,
    PlannedNumImages::Four => GptImage1p5TextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: PlannedNumImages) -> GptImage1p5EditImageNumImages {
  match n {
    PlannedNumImages::One => GptImage1p5EditImageNumImages::One,
    PlannedNumImages::Two => GptImage1p5EditImageNumImages::Two,
    PlannedNumImages::Three => GptImage1p5EditImageNumImages::Three,
    PlannedNumImages::Four => GptImage1p5EditImageNumImages::Four,
  }
}

fn to_t2i_quality(q: PlannedQuality) -> GptImage1p5TextToImageQuality {
  match q {
    PlannedQuality::Low => GptImage1p5TextToImageQuality::Low,
    PlannedQuality::Medium => GptImage1p5TextToImageQuality::Medium,
    PlannedQuality::High => GptImage1p5TextToImageQuality::High,
  }
}

fn to_edit_quality(q: PlannedQuality) -> GptImage1p5EditImageQuality {
  match q {
    PlannedQuality::Low => GptImage1p5EditImageQuality::Low,
    PlannedQuality::Medium => GptImage1p5EditImageQuality::Medium,
    PlannedQuality::High => GptImage1p5EditImageQuality::High,
  }
}

fn to_t2i_image_size(s: PlannedImageSize) -> GptImage1p5TextToImageSize {
  match s {
    PlannedImageSize::Square => GptImage1p5TextToImageSize::Square,
    PlannedImageSize::Wide => GptImage1p5TextToImageSize::Wide,
    PlannedImageSize::Tall => GptImage1p5TextToImageSize::Tall,
  }
}

fn to_edit_image_size(s: PlannedImageSize) -> GptImage1p5EditImageSize {
  match s {
    PlannedImageSize::Square => GptImage1p5EditImageSize::Square,
    PlannedImageSize::Wide => GptImage1p5EditImageSize::Wide,
    PlannedImageSize::Tall => GptImage1p5EditImageSize::Tall,
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
