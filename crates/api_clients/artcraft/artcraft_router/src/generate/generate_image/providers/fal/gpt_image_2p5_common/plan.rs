use fal_client::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_edit_image_params::GptImage2p5EditImageParams;
use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_image_size::GptImage2p5ImageSize;
use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_num_images::GptImage2p5NumImages;
use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_quality::GptImage2p5Quality;
use fal_client::requests::api::image::common::gpt_image_2p5::gpt_image_2p5_text_to_image_params::GptImage2p5TextToImageParams;

use crate::api::image_list_ref::ImageListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_quality::RouterQuality;
use crate::api::router_resolution::RouterResolution;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

/// Planned GPT Image 2.5 parameters. The mode is chosen by whether the builder carries
/// reference images: none means text-to-image, one or more means edit.
#[derive(Clone, Debug)]
pub enum PlannedGptImage2p5Params {
  TextToImage(GptImage2p5TextToImageParams),
  EditImage(GptImage2p5EditImageParams),
}

pub fn plan_gpt_image_2p5_params(
  builder: &GenerateImageRequestBuilder,
) -> Result<PlannedGptImage2p5Params, ArtcraftRouterError> {
  let prompt = builder.prompt.clone().unwrap_or_default();
  let image_urls = resolve_image_urls(builder.image_inputs.clone())?;
  let num_images = plan_num_images(builder.image_batch_count, builder.request_mismatch_mitigation_strategy)?;
  let image_size = plan_image_size(builder.aspect_ratio);
  let resolution = plan_resolution(builder.resolution);
  let quality = Some(plan_quality(builder.quality));

  if image_urls.is_empty() {
    Ok(PlannedGptImage2p5Params::TextToImage(GptImage2p5TextToImageParams {
      prompt,
      num_images,
      image_size,
      resolution,
      quality,
      background: None,
      output_format: None,
      output_compression: None,
    }))
  } else {
    Ok(PlannedGptImage2p5Params::EditImage(GptImage2p5EditImageParams {
      prompt,
      image_urls,
      mask_url: None,
      num_images,
      image_size,
      resolution,
      quality,
      background: None,
      output_format: None,
      output_compression: None,
    }))
  }
}

fn plan_num_images(
  count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<GptImage2p5NumImages, ArtcraftRouterError> {
  let count = count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(GptImage2p5NumImages::One),
    2 => Ok(GptImage2p5NumImages::Two),
    3 => Ok(GptImage2p5NumImages::Three),
    4 => Ok(GptImage2p5NumImages::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(GptImage2p5NumImages::Four),
    },
  }
}

/// The router only exposes low / medium / high; GPT Image 2.5's `xhigh` and `max` tiers are
/// not reachable through it. Fal's default (`high`) applies when unspecified.
fn plan_quality(quality: Option<RouterQuality>) -> GptImage2p5Quality {
  match quality {
    Some(RouterQuality::Low) => GptImage2p5Quality::Low,
    Some(RouterQuality::Medium) => GptImage2p5Quality::Medium,
    Some(RouterQuality::High) | None => GptImage2p5Quality::High,
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

/// `None` lets Fal apply its own default (`landscape_4_3` for text-to-image, `auto` for edit).
fn plan_image_size(aspect_ratio: Option<RouterAspectRatio>) -> Option<GptImage2p5ImageSize> {
  aspect_ratio.map(|ar| match ar {
    RouterAspectRatio::Auto
    | RouterAspectRatio::Auto2k
    | RouterAspectRatio::Auto3k
    | RouterAspectRatio::Auto4k => GptImage2p5ImageSize::Auto,
    RouterAspectRatio::Square => GptImage2p5ImageSize::Square,
    RouterAspectRatio::SquareHd => GptImage2p5ImageSize::SquareHd,
    RouterAspectRatio::WideFourByThree
    | RouterAspectRatio::WideFiveByFour => GptImage2p5ImageSize::Landscape4x3,
    RouterAspectRatio::WideThreeByTwo
    | RouterAspectRatio::WideSixteenByNine
    | RouterAspectRatio::WideTwentyOneByNine
    | RouterAspectRatio::Wide => GptImage2p5ImageSize::Landscape16x9,
    RouterAspectRatio::TallThreeByFour
    | RouterAspectRatio::TallFourByFive => GptImage2p5ImageSize::Portrait4x3,
    RouterAspectRatio::TallTwoByThree
    | RouterAspectRatio::TallNineBySixteen
    | RouterAspectRatio::TallNineByTwentyOne
    | RouterAspectRatio::Tall => GptImage2p5ImageSize::Portrait16x9,
  })
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

  const IMAGE_URL: &str = "https://example.com/img.jpg";

  #[test]
  fn mode_is_based_on_image_urls() {
    let text = unwrap_t2i(plan_gpt_image_2p5_params(&base_builder()));
    assert_eq!(text.prompt, "a cat in space");

    let edit = unwrap_edit(plan_gpt_image_2p5_params(&with_reference_image(base_builder())));
    assert_eq!(edit.prompt, "a cat in space");
    assert_eq!(edit.image_urls, vec![IMAGE_URL]);
    assert!(edit.mask_url.is_none());
  }

  #[test]
  fn optional_fal_fields_are_left_to_fal_defaults() {
    let text = unwrap_t2i(plan_gpt_image_2p5_params(&base_builder()));
    assert!(text.background.is_none());
    assert!(text.output_format.is_none());
    assert!(text.output_compression.is_none());
    assert!(text.image_size.is_none());
    assert!(text.resolution.is_none());
  }

  #[test]
  fn media_file_tokens_are_rejected() {
    let result = plan_gpt_image_2p5_params(&GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![])),
      ..base_builder()
    });
    assert!(matches!(result, Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))));
  }

  #[test]
  fn num_images_maps_exhaustively_for_text_and_edit() {
    let cases = [(1, "One"), (2, "Two"), (3, "Three"), (4, "Four")];
    for (count, expected) in cases {
      let text = unwrap_t2i(plan_gpt_image_2p5_params(&GenerateImageRequestBuilder {
        image_batch_count: Some(count),
        ..base_builder()
      }));
      assert_debug(text.num_images, expected);

      let edit = unwrap_edit(plan_gpt_image_2p5_params(&with_reference_image(GenerateImageRequestBuilder {
        image_batch_count: Some(count),
        ..base_builder()
      })));
      assert_debug(edit.num_images, expected);
    }
  }

  #[test]
  fn num_images_rejects_zero_and_handles_overflow_by_strategy() {
    assert!(matches!(
      plan_gpt_image_2p5_params(&GenerateImageRequestBuilder { image_batch_count: Some(0), ..base_builder() }),
      Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))
    ));
    assert!(matches!(
      plan_gpt_image_2p5_params(&GenerateImageRequestBuilder { image_batch_count: Some(5), ..base_builder() }),
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
    let text = unwrap_t2i(plan_gpt_image_2p5_params(&GenerateImageRequestBuilder {
      image_batch_count: Some(5),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      ..base_builder()
    }));
    assert_debug(text.num_images, "Four");
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
      let text = unwrap_t2i(plan_gpt_image_2p5_params(&GenerateImageRequestBuilder { quality, ..base_builder() }));
      assert_debug(text.quality, expected);
      let edit = unwrap_edit(plan_gpt_image_2p5_params(&with_reference_image(GenerateImageRequestBuilder { quality, ..base_builder() })));
      assert_debug(edit.quality, expected);
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
      let text = unwrap_t2i(plan_gpt_image_2p5_params(&GenerateImageRequestBuilder { resolution, ..base_builder() }));
      assert_debug(text.resolution, expected);
      let edit = unwrap_edit(plan_gpt_image_2p5_params(&with_reference_image(GenerateImageRequestBuilder { resolution, ..base_builder() })));
      assert_debug(edit.resolution, expected);
    }
  }

  #[test]
  fn aspect_ratio_maps_exhaustively_for_text_and_edit() {
    let cases = [
      (None, "None"),
      (Some(RouterAspectRatio::Auto), "Some(Auto)"),
      (Some(RouterAspectRatio::Auto2k), "Some(Auto)"),
      (Some(RouterAspectRatio::Auto3k), "Some(Auto)"),
      (Some(RouterAspectRatio::Auto4k), "Some(Auto)"),
      (Some(RouterAspectRatio::Square), "Some(Square)"),
      (Some(RouterAspectRatio::SquareHd), "Some(SquareHd)"),
      (Some(RouterAspectRatio::WideThreeByTwo), "Some(Landscape16x9)"),
      (Some(RouterAspectRatio::WideFourByThree), "Some(Landscape4x3)"),
      (Some(RouterAspectRatio::WideFiveByFour), "Some(Landscape4x3)"),
      (Some(RouterAspectRatio::WideSixteenByNine), "Some(Landscape16x9)"),
      (Some(RouterAspectRatio::WideTwentyOneByNine), "Some(Landscape16x9)"),
      (Some(RouterAspectRatio::Wide), "Some(Landscape16x9)"),
      (Some(RouterAspectRatio::TallTwoByThree), "Some(Portrait16x9)"),
      (Some(RouterAspectRatio::TallThreeByFour), "Some(Portrait4x3)"),
      (Some(RouterAspectRatio::TallFourByFive), "Some(Portrait4x3)"),
      (Some(RouterAspectRatio::TallNineBySixteen), "Some(Portrait16x9)"),
      (Some(RouterAspectRatio::TallNineByTwentyOne), "Some(Portrait16x9)"),
      (Some(RouterAspectRatio::Tall), "Some(Portrait16x9)"),
    ];
    for (aspect_ratio, expected) in cases {
      let text = unwrap_t2i(plan_gpt_image_2p5_params(&GenerateImageRequestBuilder { aspect_ratio, ..base_builder() }));
      assert_debug(text.image_size, expected);
      let edit = unwrap_edit(plan_gpt_image_2p5_params(&with_reference_image(GenerateImageRequestBuilder { aspect_ratio, ..base_builder() })));
      assert_debug(edit.image_size, expected);
    }
  }

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::GptImage2p5Flare,
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

  fn with_reference_image(builder: GenerateImageRequestBuilder) -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::Urls(vec![IMAGE_URL.to_string()])),
      ..builder
    }
  }

  fn unwrap_t2i(result: Result<PlannedGptImage2p5Params, ArtcraftRouterError>) -> GptImage2p5TextToImageParams {
    match result.expect("plan should succeed") {
      PlannedGptImage2p5Params::TextToImage(params) => params,
      PlannedGptImage2p5Params::EditImage(_) => panic!("expected text-to-image"),
    }
  }

  fn unwrap_edit(result: Result<PlannedGptImage2p5Params, ArtcraftRouterError>) -> GptImage2p5EditImageParams {
    match result.expect("plan should succeed") {
      PlannedGptImage2p5Params::EditImage(params) => params,
      PlannedGptImage2p5Params::TextToImage(_) => panic!("expected edit-image"),
    }
  }

  fn assert_debug<T: Debug>(actual: T, expected: &str) {
    assert_eq!(format!("{:?}", actual), expected);
  }
}
