use fal_client::requests::api::image::edit::nano_banana_2_edit_image::api::{
  NanoBanana2EditImageAspectRatio, NanoBanana2EditImageNumImages,
  NanoBanana2EditImageRequest, NanoBanana2EditImageResolution,
};
use fal_client::requests::api::image::text::nano_banana_2_text_to_image::api::{
  NanoBanana2TextToImageAspectRatio, NanoBanana2TextToImageNumImages,
  NanoBanana2TextToImageRequest, NanoBanana2TextToImageResolution,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::fal::nano_banana_2::request::FalNanoBanana2RequestState;

pub fn build_fal_nano_banana_2(
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

    FalNanoBanana2RequestState::TextToImage(NanoBanana2TextToImageRequest {
      prompt,
      num_images: to_t2i_num_images(num_images),
      resolution: resolution.map(to_t2i_resolution),
      aspect_ratio,
    })
  } else {
    // Edit image
    let aspect_ratio = plan_edit_aspect_ratio(builder.aspect_ratio);

    FalNanoBanana2RequestState::EditImage(NanoBanana2EditImageRequest {
      prompt,
      image_urls,
      num_images: to_edit_num_images(num_images),
      resolution: resolution.map(to_edit_resolution),
      aspect_ratio,
    })
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalNanoBanana2(state),
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

fn to_t2i_num_images(n: PlannedNumImages) -> NanoBanana2TextToImageNumImages {
  match n {
    PlannedNumImages::One => NanoBanana2TextToImageNumImages::One,
    PlannedNumImages::Two => NanoBanana2TextToImageNumImages::Two,
    PlannedNumImages::Three => NanoBanana2TextToImageNumImages::Three,
    PlannedNumImages::Four => NanoBanana2TextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: PlannedNumImages) -> NanoBanana2EditImageNumImages {
  match n {
    PlannedNumImages::One => NanoBanana2EditImageNumImages::One,
    PlannedNumImages::Two => NanoBanana2EditImageNumImages::Two,
    PlannedNumImages::Three => NanoBanana2EditImageNumImages::Three,
    PlannedNumImages::Four => NanoBanana2EditImageNumImages::Four,
  }
}

// ── Resolution ──

#[derive(Copy, Clone, Debug)]
enum PlannedResolution {
  HalfK,
  OneK,
  TwoK,
  FourK,
}

fn plan_resolution(resolution: Option<CommonResolution>) -> Option<PlannedResolution> {
  resolution.map(|r| match r {
    CommonResolution::HalfK | CommonResolution::FourEightyP => PlannedResolution::HalfK,
    CommonResolution::OneK | CommonResolution::SevenTwentyP | CommonResolution::TenEightyP => PlannedResolution::OneK,
    CommonResolution::TwoK => PlannedResolution::TwoK,
    // 3K isn't natively supported on Fal nano_banana_2; v1 downgrades to 2K
    // pricing (and TwoK resolution). Match v1 here so cost+behavior agree.
    CommonResolution::ThreeK => PlannedResolution::TwoK,
    CommonResolution::FourK => PlannedResolution::FourK,
  })
}

fn to_t2i_resolution(r: PlannedResolution) -> NanoBanana2TextToImageResolution {
  match r {
    PlannedResolution::HalfK => NanoBanana2TextToImageResolution::HalfK,
    PlannedResolution::OneK => NanoBanana2TextToImageResolution::OneK,
    PlannedResolution::TwoK => NanoBanana2TextToImageResolution::TwoK,
    PlannedResolution::FourK => NanoBanana2TextToImageResolution::FourK,
  }
}

fn to_edit_resolution(r: PlannedResolution) -> NanoBanana2EditImageResolution {
  match r {
    PlannedResolution::HalfK => NanoBanana2EditImageResolution::HalfK,
    PlannedResolution::OneK => NanoBanana2EditImageResolution::OneK,
    PlannedResolution::TwoK => NanoBanana2EditImageResolution::TwoK,
    PlannedResolution::FourK => NanoBanana2EditImageResolution::FourK,
  }
}

// ── Aspect ratio ──

fn plan_t2i_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
) -> Option<NanoBanana2TextToImageAspectRatio> {
  use NanoBanana2TextToImageAspectRatio as T;
  aspect_ratio.map(|ar| match ar {
    CommonAspectRatio::Auto | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto3k | CommonAspectRatio::Auto4k => T::Auto,
    CommonAspectRatio::Square | CommonAspectRatio::SquareHd => T::OneByOne,
    CommonAspectRatio::WideFiveByFour => T::FiveByFour,
    CommonAspectRatio::WideFourByThree => T::FourByThree,
    CommonAspectRatio::WideThreeByTwo | CommonAspectRatio::Wide => T::ThreeByTwo,
    CommonAspectRatio::WideSixteenByNine => T::SixteenByNine,
    CommonAspectRatio::WideTwentyOneByNine => T::TwentyOneByNine,
    CommonAspectRatio::TallFourByFive => T::FourByFive,
    CommonAspectRatio::TallThreeByFour => T::ThreeByFour,
    CommonAspectRatio::TallTwoByThree | CommonAspectRatio::Tall => T::TwoByThree,
    CommonAspectRatio::TallNineBySixteen => T::NineBySixteen,
    CommonAspectRatio::TallNineByTwentyOne => T::NineBySixteen, // nearest match
  })
}

fn plan_edit_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
) -> Option<NanoBanana2EditImageAspectRatio> {
  use NanoBanana2EditImageAspectRatio as E;
  aspect_ratio.map(|ar| match ar {
    CommonAspectRatio::Auto | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto3k | CommonAspectRatio::Auto4k => E::Auto,
    CommonAspectRatio::Square | CommonAspectRatio::SquareHd => E::OneByOne,
    CommonAspectRatio::WideFiveByFour => E::FiveByFour,
    CommonAspectRatio::WideFourByThree => E::FourByThree,
    CommonAspectRatio::WideThreeByTwo | CommonAspectRatio::Wide => E::ThreeByTwo,
    CommonAspectRatio::WideSixteenByNine => E::SixteenByNine,
    CommonAspectRatio::WideTwentyOneByNine => E::TwentyOneByNine,
    CommonAspectRatio::TallFourByFive => E::FourByFive,
    CommonAspectRatio::TallThreeByFour => E::ThreeByFour,
    CommonAspectRatio::TallTwoByThree | CommonAspectRatio::Tall => E::TwoByThree,
    CommonAspectRatio::TallNineBySixteen => E::NineBySixteen,
    CommonAspectRatio::TallNineByTwentyOne => E::NineBySixteen, // nearest match
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
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: CommonImageModel::NanoBanana2,
      provider: Provider::Fal,
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

  fn unwrap_t2i(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> NanoBanana2TextToImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalNanoBanana2(
        FalNanoBanana2RequestState::TextToImage(req)
      )
    ) = result.expect("build should succeed") else {
      panic!("expected TextToImage variant")
    };
    req
  }

  fn unwrap_edit(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> NanoBanana2EditImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalNanoBanana2(
        FalNanoBanana2RequestState::EditImage(req)
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
      let result = build_fal_nano_banana_2(base_builder());
      let req = unwrap_t2i(result);
      assert_eq!(req.prompt, "a cat in space");
    }

    #[test]
    fn urls_yield_edit_image() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let result = build_fal_nano_banana_2(builder);
      let req = unwrap_edit(result);
      assert_eq!(req.image_urls, vec!["https://example.com/img.jpg"]);
    }

    #[test]
    fn media_tokens_return_error() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::MediaFileTokens(vec![])),
        ..base_builder()
      };
      let result = build_fal_nano_banana_2(builder);
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
      let req = unwrap_t2i(build_fal_nano_banana_2(base_builder()));
      assert!(matches!(req.num_images, NanoBanana2TextToImageNumImages::One));
    }

    #[test]
    fn explicit_three() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(3),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.num_images, NanoBanana2TextToImageNumImages::Three));
    }

    #[test]
    fn zero_is_error() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(0),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_nano_banana_2(builder),
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
        build_fal_nano_banana_2(builder),
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
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.num_images, NanoBanana2TextToImageNumImages::Four));
    }

    #[test]
    fn edit_mode_num_images() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        image_batch_count: Some(2),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana_2(builder));
      assert!(matches!(req.num_images, NanoBanana2EditImageNumImages::Two));
    }
  }

  // ── Resolution ──

  mod resolution_tests {
    use super::*;

    #[test]
    fn none_is_none() {
      let req = unwrap_t2i(build_fal_nano_banana_2(base_builder()));
      assert!(req.resolution.is_none());
    }

    #[test]
    fn half_k_maps_to_half_k() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(CommonResolution::HalfK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.resolution, Some(NanoBanana2TextToImageResolution::HalfK)));
    }

    #[test]
    fn four_eighty_p_maps_to_half_k() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(CommonResolution::FourEightyP),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.resolution, Some(NanoBanana2TextToImageResolution::HalfK)));
    }

    #[test]
    fn one_k_maps_to_one_k() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(CommonResolution::OneK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.resolution, Some(NanoBanana2TextToImageResolution::OneK)));
    }

    #[test]
    fn two_k_maps_to_two_k() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(CommonResolution::TwoK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.resolution, Some(NanoBanana2TextToImageResolution::TwoK)));
    }

    #[test]
    fn four_k_maps_to_four_k() {
      let builder = GenerateImageRequestBuilder {
        resolution: Some(CommonResolution::FourK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.resolution, Some(NanoBanana2TextToImageResolution::FourK)));
    }

    #[test]
    fn three_k_rounds_down_to_two_k() {
      // Match v1's downgrade behavior: 3K → 2K (cheaper, no 3K native support).
      let builder = GenerateImageRequestBuilder {
        resolution: Some(CommonResolution::ThreeK),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.resolution, Some(NanoBanana2TextToImageResolution::TwoK)));
    }

    #[test]
    fn edit_mode_resolution() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        resolution: Some(CommonResolution::HalfK),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana_2(builder));
      assert!(matches!(req.resolution, Some(NanoBanana2EditImageResolution::HalfK)));
    }
  }

  // ── Aspect ratio ──

  mod aspect_ratio_tests {
    use super::*;

    #[test]
    fn none_is_none_t2i() {
      let req = unwrap_t2i(build_fal_nano_banana_2(base_builder()));
      assert!(req.aspect_ratio.is_none());
    }

    #[test]
    fn auto_maps_to_auto_t2i() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Auto),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBanana2TextToImageAspectRatio::Auto)));
    }

    #[test]
    fn square_maps_to_one_by_one() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Square),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBanana2TextToImageAspectRatio::OneByOne)));
    }

    #[test]
    fn wide_sixteen_by_nine() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBanana2TextToImageAspectRatio::SixteenByNine)));
    }

    #[test]
    fn tall_nine_by_sixteen() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBanana2TextToImageAspectRatio::NineBySixteen)));
    }

    #[test]
    fn edit_auto() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Auto),
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana_2(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBanana2EditImageAspectRatio::Auto)));
    }

    #[test]
    fn edit_square() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::SquareHd),
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana_2(builder));
      assert!(matches!(req.aspect_ratio, Some(NanoBanana2EditImageAspectRatio::OneByOne)));
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
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert_eq!(req.prompt, "my custom prompt");
    }

    #[test]
    fn missing_prompt_defaults_to_empty() {
      let builder = GenerateImageRequestBuilder {
        prompt: None,
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana_2(builder));
      assert_eq!(req.prompt, "");
    }
  }
}
