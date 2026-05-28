use fal_client::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
use fal_client::requests::api::image::edit::gpt_image_2_edit_image::api::{
  GptImage2EditImageNumImages, GptImage2EditImageQuality, GptImage2EditImageRequest,
  GptImage2EditImageSize,
};
use fal_client::requests::api::image::text::gpt_image_2_text_to_image::api::{
  GptImage2TextToImageNumImages, GptImage2TextToImageQuality,
  GptImage2TextToImageRequest, GptImage2TextToImageSize,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_quality::RouterQuality;
use crate::api::router_resolution::RouterResolution;
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

fn plan_quality(quality: Option<RouterQuality>) -> PlannedQuality {
  match quality {
    Some(RouterQuality::Low) => PlannedQuality::Low,
    Some(RouterQuality::Medium) => PlannedQuality::Medium,
    Some(RouterQuality::High) | None => PlannedQuality::High,
  }
}

fn plan_resolution(resolution: Option<RouterResolution>) -> Option<GptImage2Resolution> {
  resolution.map(|r| match r {
    RouterResolution::HalfK
    | RouterResolution::FourEightyP
    | RouterResolution::SevenTwentyP
    | RouterResolution::OneK => GptImage2Resolution::OneK,
    RouterResolution::TenEightyP | RouterResolution::TwoK => GptImage2Resolution::TwoK,
    RouterResolution::ThreeK => GptImage2Resolution::ThreeK,
    RouterResolution::FourK => GptImage2Resolution::FourK,
  })
}

fn plan_image_size(aspect_ratio: Option<RouterAspectRatio>) -> Option<PlannedImageSize> {
  match aspect_ratio {
    None => None,
    Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => Some(PlannedImageSize::Auto),
    Some(RouterAspectRatio::Square) => Some(PlannedImageSize::Square),
    Some(RouterAspectRatio::SquareHd) => Some(PlannedImageSize::SquareHd),
    Some(RouterAspectRatio::WideFourByThree)
    | Some(RouterAspectRatio::WideFiveByFour) => Some(PlannedImageSize::Landscape4x3),
    Some(RouterAspectRatio::WideThreeByTwo)
    | Some(RouterAspectRatio::WideSixteenByNine)
    | Some(RouterAspectRatio::WideTwentyOneByNine)
    | Some(RouterAspectRatio::Wide) => Some(PlannedImageSize::Landscape16x9),
    Some(RouterAspectRatio::TallThreeByFour)
    | Some(RouterAspectRatio::TallFourByFive) => Some(PlannedImageSize::Portrait4x3),
    Some(RouterAspectRatio::TallTwoByThree)
    | Some(RouterAspectRatio::TallNineBySixteen)
    | Some(RouterAspectRatio::TallNineByTwentyOne)
    | Some(RouterAspectRatio::Tall) => Some(PlannedImageSize::Portrait16x9),
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

#[cfg(test)]
mod tests {
  use super::*;
  use std::fmt::Debug;

  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::GptImage2,
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

  fn unwrap_t2i(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> GptImage2TextToImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalGptImage2(
        FalGptImage2RequestState::TextToImage(req)
      )
    ) = result.expect("build should succeed") else {
      panic!("expected GPT Image 2 text-to-image request")
    };
    req
  }

  fn unwrap_edit(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> GptImage2EditImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalGptImage2(
        FalGptImage2RequestState::EditImage(req)
      )
    ) = result.expect("build should succeed") else {
      panic!("expected GPT Image 2 edit-image request")
    };
    req
  }

  fn assert_debug<T: Debug>(actual: T, expected: &str) {
    assert_eq!(format!("{:?}", actual), expected);
  }

  #[test]
  fn build2_routes_to_gpt_image_2_request() {
    let req = unwrap_t2i(base_builder().build2());
    assert_eq!(req.prompt, "a cat in space");
  }

  #[test]
  fn mode_detection_is_based_on_image_urls() {
    let text_req = unwrap_t2i(build_fal_gpt_image_2(base_builder()));
    assert_eq!(text_req.prompt, "a cat in space");

    let edit_req = unwrap_edit(build_fal_gpt_image_2(GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
      ..base_builder()
    }));
    assert_eq!(edit_req.image_urls, vec!["https://example.com/img.jpg"]);
  }

  #[test]
  fn media_file_tokens_are_rejected() {
    let result = build_fal_gpt_image_2(GenerateImageRequestBuilder {
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
    let cases = [
      (1, "One"),
      (2, "Two"),
      (3, "Three"),
      (4, "Four"),
    ];

    for (count, expected) in cases {
      let req = unwrap_t2i(build_fal_gpt_image_2(GenerateImageRequestBuilder {
        image_batch_count: Some(count),
        ..base_builder()
      }));
      assert_debug(req.num_images, expected);
    }

    for (count, expected) in cases {
      let req = unwrap_edit(build_fal_gpt_image_2(GenerateImageRequestBuilder {
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
      build_fal_gpt_image_2(GenerateImageRequestBuilder {
        image_batch_count: Some(0),
        ..base_builder()
      }),
      Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))
    ));
    assert!(matches!(
      build_fal_gpt_image_2(GenerateImageRequestBuilder {
        image_batch_count: Some(5),
        ..base_builder()
      }),
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));

    let req = unwrap_t2i(build_fal_gpt_image_2(GenerateImageRequestBuilder {
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
      let req = unwrap_t2i(build_fal_gpt_image_2(GenerateImageRequestBuilder {
        quality,
        ..base_builder()
      }));
      assert_debug(req.quality, expected);
    }

    for (quality, expected) in cases {
      let req = unwrap_edit(build_fal_gpt_image_2(GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        quality,
        ..base_builder()
      }));
      assert_debug(req.quality, expected);
    }
  }

  #[test]
  fn resolution_maps_exhaustively_for_text_and_edit() {
    let cases = [
      (None, "None"),
      (Some(RouterResolution::HalfK), "Some(OneK)"),
      (Some(RouterResolution::FourEightyP), "Some(OneK)"),
      (Some(RouterResolution::SevenTwentyP), "Some(OneK)"),
      (Some(RouterResolution::OneK), "Some(OneK)"),
      (Some(RouterResolution::TenEightyP), "Some(TwoK)"),
      (Some(RouterResolution::TwoK), "Some(TwoK)"),
      (Some(RouterResolution::ThreeK), "Some(ThreeK)"),
      (Some(RouterResolution::FourK), "Some(FourK)"),
    ];

    for (resolution, expected) in cases {
      let req = unwrap_t2i(build_fal_gpt_image_2(GenerateImageRequestBuilder {
        resolution,
        ..base_builder()
      }));
      assert_debug(req.resolution, expected);
    }

    for (resolution, expected) in cases {
      let req = unwrap_edit(build_fal_gpt_image_2(GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        resolution,
        ..base_builder()
      }));
      assert_debug(req.resolution, expected);
    }
  }

  #[test]
  fn aspect_ratio_maps_exhaustively_for_text_and_edit() {
    let cases = [
      (None, "None", "None"),
      (Some(RouterAspectRatio::Auto), "None", "Some(Auto)"),
      (Some(RouterAspectRatio::Auto2k), "None", "Some(Auto)"),
      (Some(RouterAspectRatio::Auto3k), "None", "Some(Auto)"),
      (Some(RouterAspectRatio::Auto4k), "None", "Some(Auto)"),
      (Some(RouterAspectRatio::Square), "Some(Square)", "Some(Square)"),
      (Some(RouterAspectRatio::SquareHd), "Some(SquareHd)", "Some(SquareHd)"),
      (Some(RouterAspectRatio::WideThreeByTwo), "Some(Landscape16x9)", "Some(Landscape16x9)"),
      (Some(RouterAspectRatio::WideFourByThree), "Some(Landscape4x3)", "Some(Landscape4x3)"),
      (Some(RouterAspectRatio::WideFiveByFour), "Some(Landscape4x3)", "Some(Landscape4x3)"),
      (Some(RouterAspectRatio::WideSixteenByNine), "Some(Landscape16x9)", "Some(Landscape16x9)"),
      (Some(RouterAspectRatio::WideTwentyOneByNine), "Some(Landscape16x9)", "Some(Landscape16x9)"),
      (Some(RouterAspectRatio::Wide), "Some(Landscape16x9)", "Some(Landscape16x9)"),
      (Some(RouterAspectRatio::TallTwoByThree), "Some(Portrait16x9)", "Some(Portrait16x9)"),
      (Some(RouterAspectRatio::TallThreeByFour), "Some(Portrait4x3)", "Some(Portrait4x3)"),
      (Some(RouterAspectRatio::TallFourByFive), "Some(Portrait4x3)", "Some(Portrait4x3)"),
      (Some(RouterAspectRatio::TallNineBySixteen), "Some(Portrait16x9)", "Some(Portrait16x9)"),
      (Some(RouterAspectRatio::TallNineByTwentyOne), "Some(Portrait16x9)", "Some(Portrait16x9)"),
      (Some(RouterAspectRatio::Tall), "Some(Portrait16x9)", "Some(Portrait16x9)"),
    ];

    for (aspect_ratio, expected_t2i, _) in cases {
      let req = unwrap_t2i(build_fal_gpt_image_2(GenerateImageRequestBuilder {
        aspect_ratio,
        ..base_builder()
      }));
      assert_debug(req.image_size, expected_t2i);
    }

    for (aspect_ratio, _, expected_edit) in cases {
      let req = unwrap_edit(build_fal_gpt_image_2(GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        aspect_ratio,
        ..base_builder()
      }));
      assert_debug(req.image_size, expected_edit);
    }
  }
}
