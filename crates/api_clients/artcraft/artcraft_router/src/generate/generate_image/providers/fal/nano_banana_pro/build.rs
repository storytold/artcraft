use fal_client::requests::api::image::edit::nano_banana_pro_edit_image::api::{
  NanoBananaProEditImageAspectRatio, NanoBananaProEditImageNumImages,
  NanoBananaProEditImageRequest, NanoBananaProEditImageResolution,
};
use fal_client::requests::api::image::text::nano_banana_pro_text_to_image::api::{
  NanoBananaProTextToImageAspectRatio, NanoBananaProTextToImageNumImages,
  NanoBananaProTextToImageRequest, NanoBananaProTextToImageResolution,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image::providers::fal::nano_banana_pro::request::FalNanoBananaProRequestState;

pub fn build_fal_nano_banana_pro(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let prompt = builder.prompt.clone().unwrap_or_default();
  let num_images = plan_num_images(builder.image_batch_count, strategy)?;
  let resolution = plan_resolution(builder.resolution);
  let image_urls = resolve_image_urls(builder.image_inputs.clone())?;

  let state = if image_urls.is_empty() {
    // Text-to-image
    let aspect_ratio = plan_t2i_aspect_ratio(builder.aspect_ratio);

    FalNanoBananaProRequestState::TextToImage(NanoBananaProTextToImageRequest {
      prompt,
      num_images: to_t2i_num_images(num_images),
      resolution: resolution.map(to_t2i_resolution),
      aspect_ratio,
    })
  } else {
    // Edit image
    let aspect_ratio = plan_edit_aspect_ratio(builder.aspect_ratio);

    FalNanoBananaProRequestState::EditImage(NanoBananaProEditImageRequest {
      prompt,
      image_urls,
      num_images: to_edit_num_images(num_images),
      resolution: resolution.map(to_edit_resolution),
      aspect_ratio,
    })
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalNanoBananaPro(state),
  ))
}

// ── Num images ──

#[derive(Copy, Clone, Debug)]
enum PlannedNumImages {
  One,
  Two,
  Three,
  Four,
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

fn to_t2i_num_images(n: PlannedNumImages) -> NanoBananaProTextToImageNumImages {
  match n {
    PlannedNumImages::One => NanoBananaProTextToImageNumImages::One,
    PlannedNumImages::Two => NanoBananaProTextToImageNumImages::Two,
    PlannedNumImages::Three => NanoBananaProTextToImageNumImages::Three,
    PlannedNumImages::Four => NanoBananaProTextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: PlannedNumImages) -> NanoBananaProEditImageNumImages {
  match n {
    PlannedNumImages::One => NanoBananaProEditImageNumImages::One,
    PlannedNumImages::Two => NanoBananaProEditImageNumImages::Two,
    PlannedNumImages::Three => NanoBananaProEditImageNumImages::Three,
    PlannedNumImages::Four => NanoBananaProEditImageNumImages::Four,
  }
}

// ── Resolution ──

#[derive(Copy, Clone, Debug)]
enum PlannedResolution {
  OneK,
  TwoK,
  FourK,
}

fn plan_resolution(resolution: Option<RouterResolution>) -> Option<PlannedResolution> {
  resolution.map(|r| match r {
    RouterResolution::HalfK | RouterResolution::FourEightyP | RouterResolution::SevenTwentyP
    | RouterResolution::OneK | RouterResolution::TenEightyP => PlannedResolution::OneK,
    RouterResolution::TwoK => PlannedResolution::TwoK,
    // 3K isn't natively supported on Fal nano_banana_pro; v1 downgrades to 2K
    // pricing (and TwoK resolution). Match v1 here so cost+behavior agree.
    RouterResolution::ThreeK => PlannedResolution::TwoK,
    RouterResolution::FourK => PlannedResolution::FourK,
  })
}

fn to_t2i_resolution(r: PlannedResolution) -> NanoBananaProTextToImageResolution {
  match r {
    PlannedResolution::OneK => NanoBananaProTextToImageResolution::OneK,
    PlannedResolution::TwoK => NanoBananaProTextToImageResolution::TwoK,
    PlannedResolution::FourK => NanoBananaProTextToImageResolution::FourK,
  }
}

fn to_edit_resolution(r: PlannedResolution) -> NanoBananaProEditImageResolution {
  match r {
    PlannedResolution::OneK => NanoBananaProEditImageResolution::OneK,
    PlannedResolution::TwoK => NanoBananaProEditImageResolution::TwoK,
    PlannedResolution::FourK => NanoBananaProEditImageResolution::FourK,
  }
}

// ── Aspect ratio ──

fn plan_t2i_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
) -> Option<NanoBananaProTextToImageAspectRatio> {
  use NanoBananaProTextToImageAspectRatio as T;
  aspect_ratio.and_then(|ar| match ar {
    RouterAspectRatio::Square | RouterAspectRatio::SquareHd => Some(T::OneByOne),
    RouterAspectRatio::WideFiveByFour => Some(T::FiveByFour),
    RouterAspectRatio::WideFourByThree => Some(T::FourByThree),
    RouterAspectRatio::WideThreeByTwo | RouterAspectRatio::Wide => Some(T::ThreeByTwo),
    RouterAspectRatio::WideSixteenByNine => Some(T::SixteenByNine),
    RouterAspectRatio::WideTwentyOneByNine => Some(T::TwentyOneByNine),
    RouterAspectRatio::TallFourByFive => Some(T::FourByFive),
    RouterAspectRatio::TallThreeByFour => Some(T::ThreeByFour),
    RouterAspectRatio::TallTwoByThree | RouterAspectRatio::Tall => Some(T::TwoByThree),
    RouterAspectRatio::TallNineBySixteen => Some(T::NineBySixteen),
    RouterAspectRatio::TallNineByTwentyOne => Some(T::NineBySixteen), // nearest match
    RouterAspectRatio::Auto | RouterAspectRatio::Auto2k
    | RouterAspectRatio::Auto3k | RouterAspectRatio::Auto4k => None,
  })
}

fn plan_edit_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
) -> Option<NanoBananaProEditImageAspectRatio> {
  use NanoBananaProEditImageAspectRatio as E;
  aspect_ratio.map(|ar| match ar {
    RouterAspectRatio::Auto | RouterAspectRatio::Auto2k
    | RouterAspectRatio::Auto3k | RouterAspectRatio::Auto4k => E::Auto,
    RouterAspectRatio::Square | RouterAspectRatio::SquareHd => E::OneByOne,
    RouterAspectRatio::WideFiveByFour => E::FiveByFour,
    RouterAspectRatio::WideFourByThree => E::FourByThree,
    RouterAspectRatio::WideThreeByTwo | RouterAspectRatio::Wide => E::ThreeByTwo,
    RouterAspectRatio::WideSixteenByNine => E::SixteenByNine,
    RouterAspectRatio::WideTwentyOneByNine => E::TwentyOneByNine,
    RouterAspectRatio::TallFourByFive => E::FourByFive,
    RouterAspectRatio::TallThreeByFour => E::ThreeByFour,
    RouterAspectRatio::TallTwoByThree | RouterAspectRatio::Tall => E::TwoByThree,
    RouterAspectRatio::TallNineBySixteen => E::NineBySixteen,
    RouterAspectRatio::TallNineByTwentyOne => E::NineBySixteen, // nearest match
  })
}

// ── Image inputs ──

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
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::NanoBananaPro,
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

  fn unwrap_t2i(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> NanoBananaProTextToImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalNanoBananaPro(
        FalNanoBananaProRequestState::TextToImage(req)
      )
    ) = result.expect("build should succeed") else {
      panic!("expected TextToImage variant")
    };
    req
  }

  fn unwrap_edit(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> NanoBananaProEditImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalNanoBananaPro(
        FalNanoBananaProRequestState::EditImage(req)
      )
    ) = result.expect("build should succeed") else {
      panic!("expected EditImage variant")
    };
    req
  }

  // ── Mode detection ──

  mod mode_detection {
    use super::*;

    #[test]
    fn no_images_yields_text_to_image() {
      let result = build_fal_nano_banana_pro(base_builder());
      let req = unwrap_t2i(result);
      assert_eq!(req.prompt, "a cat in space");
    }

    #[test]
    fn urls_yield_edit_image() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let result = build_fal_nano_banana_pro(builder);
      let req = unwrap_edit(result);
      assert_eq!(req.image_urls, vec!["https://example.com/img.jpg"]);
    }

    #[test]
    fn media_tokens_return_error() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::MediaFileTokens(vec![])),
        ..base_builder()
      };
      let result = build_fal_nano_banana_pro(builder);
      assert!(matches!(
        result,
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }
  }

  // ── Num images ──

  mod num_images_tests {
    use super::*;

    #[test]
    fn default_is_one() {
      let req = unwrap_t2i(build_fal_nano_banana_pro(base_builder()));
      assert!(matches!(req.num_images, NanoBananaProTextToImageNumImages::One));
    }

    #[test]
    fn explicit_three() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(3),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.num_images, NanoBananaProTextToImageNumImages::Three));
    }

    #[test]
    fn zero_is_error() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(0),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_nano_banana_pro(builder),
        Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))
      ));
    }

    #[test]
    fn over_four_error_out() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(7),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_nano_banana_pro(builder),
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
      ));
    }

    #[test]
    fn over_four_clamps_with_upgrade() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(7),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.num_images, NanoBananaProTextToImageNumImages::Four));
    }

    #[test]
    fn edit_mode_num_images() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        image_batch_count: Some(2),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.num_images, NanoBananaProEditImageNumImages::Two));
    }
  }

  // ── Resolution ──

  mod resolution_tests {
    use super::*;

    #[test]
    fn none_is_none() {
      let req = unwrap_t2i(build_fal_nano_banana_pro(base_builder()));
      assert!(req.resolution.is_none());
    }

    #[test]
    fn one_k_maps_to_one_k() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(RouterResolution::OneK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.resolution, Some(NanoBananaProTextToImageResolution::OneK)));
    }

    #[test]
    fn two_k_maps_to_two_k() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(RouterResolution::TwoK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.resolution, Some(NanoBananaProTextToImageResolution::TwoK)));
    }

    #[test]
    fn four_k_maps_to_four_k() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(RouterResolution::FourK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.resolution, Some(NanoBananaProTextToImageResolution::FourK)));
    }

    #[test]
    fn three_k_rounds_down_to_two_k() {
      // Match v1's downgrade behavior: 3K → 2K (cheaper, no 3K native support).
      let builder = GenerateImageRequestBuilder {
        resolution: Some(RouterResolution::ThreeK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.resolution, Some(NanoBananaProTextToImageResolution::TwoK)));
    }

    #[test]
    fn half_k_rounds_to_one_k() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(RouterResolution::HalfK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.resolution, Some(NanoBananaProTextToImageResolution::OneK)));
    }

    #[test]
    fn edit_mode_resolution() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        resolution: Some(RouterResolution::FourK),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.resolution, Some(NanoBananaProEditImageResolution::FourK)));
    }
  }

  // ── Aspect ratio ──

  mod aspect_ratio_tests {
    use super::*;

    #[test]
    fn none_is_none_t2i() {
      let req = unwrap_t2i(build_fal_nano_banana_pro(base_builder()));
      assert!(req.aspect_ratio.is_none());
    }

    #[test]
    fn square_maps_to_one_by_one() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(RouterAspectRatio::Square),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBananaProTextToImageAspectRatio::OneByOne)));
    }

    #[test]
    fn wide_sixteen_by_nine() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBananaProTextToImageAspectRatio::SixteenByNine)));
    }

    #[test]
    fn tall_nine_by_sixteen() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(RouterAspectRatio::TallNineBySixteen),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBananaProTextToImageAspectRatio::NineBySixteen)));
    }

    #[test]
    fn auto_yields_none_for_t2i() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(RouterAspectRatio::Auto),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert!(req.aspect_ratio.is_none());
    }

    #[test]
    fn auto_yields_auto_for_edit() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(RouterAspectRatio::Auto),
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBananaProEditImageAspectRatio::Auto)));
    }

    #[test]
    fn edit_square() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(RouterAspectRatio::SquareHd),
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana_pro(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBananaProEditImageAspectRatio::OneByOne)));
    }
  }

  // ── Prompt ──

  mod prompt_tests {
    use super::*;

    #[test]
    fn prompt_is_passed_through() {
      let builder = GenerateImageRequestBuilder {
        prompt: Some("my custom prompt".to_string()),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert_eq!(req.prompt, "my custom prompt");
    }

    #[test]
    fn missing_prompt_defaults_to_empty() {
      let builder = GenerateImageRequestBuilder {
        prompt: None,
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_pro(builder));
      assert_eq!(req.prompt, "");
    }
  }
}
