use fal_client::requests::api::image::edit::gpt_image_1_edit_image::api::{
  GptImage1EditImageNumImages, GptImage1EditImageQuality, GptImage1EditImageRequest,
  GptImage1EditImageSize,
};
use fal_client::requests::api::image::text::gpt_image_1_text_to_image::api::{
  GptImage1TextToImageNumImages, GptImage1TextToImageQuality,
  GptImage1TextToImageRequest, GptImage1TextToImageSize,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_quality::RouterQuality;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::fal::gpt_image_1::request::FalGptImage1RequestState;

pub fn build_fal_gpt_image_1(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let prompt = builder.prompt.clone().unwrap_or_default();
  let image_urls = resolve_image_urls(builder.image_inputs.clone())?;
  let num_images = plan_num_images(builder.image_batch_count, builder.request_mismatch_mitigation_strategy)?;
  let image_size = plan_image_size(builder.aspect_ratio);
  let quality = plan_quality(builder.quality);

  let state = if image_urls.is_empty() {
    FalGptImage1RequestState::TextToImage(GptImage1TextToImageRequest {
      prompt,
      num_images: to_t2i_num_images(num_images),
      image_size: image_size.map(to_t2i_image_size),
      quality: Some(to_t2i_quality(quality)),
      background: None,
      output_format: None,
    })
  } else {
    FalGptImage1RequestState::EditImage(GptImage1EditImageRequest {
      prompt,
      image_urls,
      num_images: to_edit_num_images(num_images),
      mask_image_url: None,
      image_size: image_size.map(to_edit_image_size),
      quality: Some(to_edit_quality(quality)),
      input_fidelity: None,
      background: None,
      output_format: None,
    })
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalGptImage1(state),
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
  Horizontal,
  Vertical,
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

fn plan_quality(quality: Option<RouterQuality>) -> PlannedQuality {
  match quality {
    Some(RouterQuality::Low) => PlannedQuality::Low,
    Some(RouterQuality::Medium) => PlannedQuality::Medium,
    Some(RouterQuality::High) | None => PlannedQuality::High,
  }
}

fn plan_image_size(aspect_ratio: Option<RouterAspectRatio>) -> Option<PlannedImageSize> {
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => None,
    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => {
      Some(PlannedImageSize::Square)
    }
    Some(RouterAspectRatio::WideThreeByTwo)
    | Some(RouterAspectRatio::WideFourByThree)
    | Some(RouterAspectRatio::WideFiveByFour)
    | Some(RouterAspectRatio::WideSixteenByNine)
    | Some(RouterAspectRatio::WideTwentyOneByNine)
    | Some(RouterAspectRatio::Wide) => Some(PlannedImageSize::Horizontal),
    Some(RouterAspectRatio::TallTwoByThree)
    | Some(RouterAspectRatio::TallThreeByFour)
    | Some(RouterAspectRatio::TallFourByFive)
    | Some(RouterAspectRatio::TallNineBySixteen)
    | Some(RouterAspectRatio::TallNineByTwentyOne)
    | Some(RouterAspectRatio::Tall) => Some(PlannedImageSize::Vertical),
  }
}

fn to_t2i_num_images(n: PlannedNumImages) -> GptImage1TextToImageNumImages {
  match n {
    PlannedNumImages::One => GptImage1TextToImageNumImages::One,
    PlannedNumImages::Two => GptImage1TextToImageNumImages::Two,
    PlannedNumImages::Three => GptImage1TextToImageNumImages::Three,
    PlannedNumImages::Four => GptImage1TextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: PlannedNumImages) -> GptImage1EditImageNumImages {
  match n {
    PlannedNumImages::One => GptImage1EditImageNumImages::One,
    PlannedNumImages::Two => GptImage1EditImageNumImages::Two,
    PlannedNumImages::Three => GptImage1EditImageNumImages::Three,
    PlannedNumImages::Four => GptImage1EditImageNumImages::Four,
  }
}

fn to_t2i_quality(q: PlannedQuality) -> GptImage1TextToImageQuality {
  match q {
    PlannedQuality::Low => GptImage1TextToImageQuality::Low,
    PlannedQuality::Medium => GptImage1TextToImageQuality::Medium,
    PlannedQuality::High => GptImage1TextToImageQuality::High,
  }
}

fn to_edit_quality(q: PlannedQuality) -> GptImage1EditImageQuality {
  match q {
    PlannedQuality::Low => GptImage1EditImageQuality::Low,
    PlannedQuality::Medium => GptImage1EditImageQuality::Medium,
    PlannedQuality::High => GptImage1EditImageQuality::High,
  }
}

fn to_t2i_image_size(s: PlannedImageSize) -> GptImage1TextToImageSize {
  match s {
    PlannedImageSize::Square => GptImage1TextToImageSize::Square,
    PlannedImageSize::Horizontal => GptImage1TextToImageSize::Horizontal,
    PlannedImageSize::Vertical => GptImage1TextToImageSize::Vertical,
  }
}

fn to_edit_image_size(s: PlannedImageSize) -> GptImage1EditImageSize {
  match s {
    PlannedImageSize::Square => GptImage1EditImageSize::Square,
    PlannedImageSize::Horizontal => GptImage1EditImageSize::Horizontal,
    PlannedImageSize::Vertical => GptImage1EditImageSize::Vertical,
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

#[cfg(test)]
mod tests {
  use super::*;
  use std::fmt::Debug;

  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::GptImage1,
      provider: RouterProvider::Fal,
      prompt: Some("a cat in space".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }

  fn unwrap_t2i(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> GptImage1TextToImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalGptImage1(
        FalGptImage1RequestState::TextToImage(req)
      )
    ) = result.expect("build should succeed") else {
      panic!("expected GPT Image 1 text-to-image request")
    };
    req
  }

  fn unwrap_edit(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> GptImage1EditImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalGptImage1(
        FalGptImage1RequestState::EditImage(req)
      )
    ) = result.expect("build should succeed") else {
      panic!("expected GPT Image 1 edit-image request")
    };
    req
  }

  fn assert_debug<T: Debug>(actual: T, expected: &str) {
    assert_eq!(format!("{:?}", actual), expected);
  }

  #[test]
  fn build2_routes_to_gpt_image_1_request() {
    let req = unwrap_t2i(base_builder().build2());
    assert_eq!(req.prompt, "a cat in space");
  }

  #[test]
  fn mode_detection_is_based_on_image_urls() {
    let text_req = unwrap_t2i(build_fal_gpt_image_1(base_builder()));
    assert_eq!(text_req.prompt, "a cat in space");

    let edit_req = unwrap_edit(build_fal_gpt_image_1(GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
      ..base_builder()
    }));
    assert_eq!(edit_req.image_urls, vec!["https://example.com/img.jpg"]);
  }

  #[test]
  fn media_file_tokens_are_rejected() {
    let result = build_fal_gpt_image_1(GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![])),
      ..base_builder()
    });
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    ));
  }

  #[test]
  fn num_images_maps_exhaustively_for_text_and_edit() {
    let text_cases = [
      (1, "One"),
      (2, "Two"),
      (3, "Three"),
      (4, "Four"),
    ];

    for (count, expected) in text_cases {
      let req = unwrap_t2i(build_fal_gpt_image_1(GenerateImageRequestBuilder {
        image_batch_count: Some(count),
        ..base_builder()
      }));
      assert_debug(req.num_images, expected);
    }

    for (count, expected) in text_cases {
      let req = unwrap_edit(build_fal_gpt_image_1(GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        image_batch_count: Some(count),
        ..base_builder()
      }));
      assert_debug(req.num_images, expected);
    }
  }

  #[test]
  fn num_images_rejects_zero_and_handles_overflow_by_strategy() {
    assert!(matches!(
      build_fal_gpt_image_1(GenerateImageRequestBuilder {
        image_batch_count: Some(0),
        ..base_builder()
      }),
      Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))
    ));
    assert!(matches!(
      build_fal_gpt_image_1(GenerateImageRequestBuilder {
        image_batch_count: Some(5),
        ..base_builder()
      }),
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));

    let req = unwrap_t2i(build_fal_gpt_image_1(GenerateImageRequestBuilder {
      image_batch_count: Some(5),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      ..base_builder()
    }));
    assert_debug(req.num_images, "Four");
  }

  #[test]
  fn quality_maps_exhaustively_for_text_and_edit() {
    let cases = [
      (None, "Some(High)"),
      (Some(RouterQuality::Low), "Some(Low)"),
      (Some(RouterQuality::Medium), "Some(Medium)"),
      (Some(RouterQuality::High), "Some(High)"),
    ];

    for (quality, expected) in cases {
      let req = unwrap_t2i(build_fal_gpt_image_1(GenerateImageRequestBuilder {
        quality,
        ..base_builder()
      }));
      assert_debug(req.quality, expected);
    }

    for (quality, expected) in cases {
      let req = unwrap_edit(build_fal_gpt_image_1(GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        quality,
        ..base_builder()
      }));
      assert_debug(req.quality, expected);
    }
  }

  #[test]
  fn aspect_ratio_maps_exhaustively_for_text_and_edit() {
    let cases = [
      (None, "None"),
      (Some(RouterAspectRatio::Auto), "None"),
      (Some(RouterAspectRatio::Auto2k), "None"),
      (Some(RouterAspectRatio::Auto3k), "None"),
      (Some(RouterAspectRatio::Auto4k), "None"),
      (Some(RouterAspectRatio::Square), "Some(Square)"),
      (Some(RouterAspectRatio::SquareHd), "Some(Square)"),
      (Some(RouterAspectRatio::WideThreeByTwo), "Some(Horizontal)"),
      (Some(RouterAspectRatio::WideFourByThree), "Some(Horizontal)"),
      (Some(RouterAspectRatio::WideFiveByFour), "Some(Horizontal)"),
      (Some(RouterAspectRatio::WideSixteenByNine), "Some(Horizontal)"),
      (Some(RouterAspectRatio::WideTwentyOneByNine), "Some(Horizontal)"),
      (Some(RouterAspectRatio::Wide), "Some(Horizontal)"),
      (Some(RouterAspectRatio::TallTwoByThree), "Some(Vertical)"),
      (Some(RouterAspectRatio::TallThreeByFour), "Some(Vertical)"),
      (Some(RouterAspectRatio::TallFourByFive), "Some(Vertical)"),
      (Some(RouterAspectRatio::TallNineBySixteen), "Some(Vertical)"),
      (Some(RouterAspectRatio::TallNineByTwentyOne), "Some(Vertical)"),
      (Some(RouterAspectRatio::Tall), "Some(Vertical)"),
    ];

    for (aspect_ratio, expected) in cases {
      let req = unwrap_t2i(build_fal_gpt_image_1(GenerateImageRequestBuilder {
        aspect_ratio,
        ..base_builder()
      }));
      assert_debug(req.image_size, expected);
    }

    for (aspect_ratio, expected) in cases {
      let req = unwrap_edit(build_fal_gpt_image_1(GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        aspect_ratio,
        ..base_builder()
      }));
      assert_debug(req.image_size, expected);
    }
  }
}
