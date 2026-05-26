use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v5_lite_edit_image_webhook::{
  EnqueueBytedanceSeedreamV5LiteEditImageNumImages, EnqueueBytedanceSeedreamV5LiteEditImageRequest,
  EnqueueBytedanceSeedreamV5LiteEditImageSize,
};
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v5_lite_text_to_image_webhook::{
  EnqueueBytedanceSeedreamV5LiteTextToImageNumImages, EnqueueBytedanceSeedreamV5LiteTextToImageRequest,
  EnqueueBytedanceSeedreamV5LiteTextToImageSize,
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
use crate::generate::generate_image_v2::providers::fal::seedream_5_lite::request::FalSeedream5LiteRequestState;

pub fn build_fal_seedream_5_lite(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;
  let image_urls = resolve_image_list_ref(builder.image_inputs.clone())?;
  let image_size = plan_image_size(builder.aspect_ratio, builder.resolution, strategy)?;
  let num_images = plan_num_images(builder.image_batch_count, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();

  let state = if image_urls.is_empty() {
    FalSeedream5LiteRequestState::TextToImage(EnqueueBytedanceSeedreamV5LiteTextToImageRequest {
      prompt,
      num_images: Some(to_t2i_num_images(num_images)),
      max_images: None,
      image_size: image_size.map(to_t2i_image_size),
    })
  } else {
    FalSeedream5LiteRequestState::EditImage(EnqueueBytedanceSeedreamV5LiteEditImageRequest {
      prompt,
      image_urls,
      num_images: Some(to_edit_num_images(num_images)),
      max_images: None,
      image_size: image_size.map(to_edit_image_size),
    })
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalSeedream5Lite(state),
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

fn to_t2i_num_images(n: PlannedNumImages) -> EnqueueBytedanceSeedreamV5LiteTextToImageNumImages {
  use EnqueueBytedanceSeedreamV5LiteTextToImageNumImages as T;
  match n {
    PlannedNumImages::One => T::One,
    PlannedNumImages::Two => T::Two,
    PlannedNumImages::Three => T::Three,
    PlannedNumImages::Four => T::Four,
  }
}

fn to_edit_num_images(n: PlannedNumImages) -> EnqueueBytedanceSeedreamV5LiteEditImageNumImages {
  use EnqueueBytedanceSeedreamV5LiteEditImageNumImages as E;
  match n {
    PlannedNumImages::One => E::One,
    PlannedNumImages::Two => E::Two,
    PlannedNumImages::Three => E::Three,
    PlannedNumImages::Four => E::Four,
  }
}

// ── Image size ──
//
// Note: Seedream V5 Lite supports Auto2k and Auto3k (no 4K, no bare Auto).
// Auto4k requests fall back to Auto3k.

#[derive(Copy, Clone, Debug)]
enum PlannedImageSize {
  Square,
  SquareHd,
  PortraitFourThree,
  PortraitSixteenNine,
  LandscapeFourThree,
  LandscapeSixteenNine,
  Auto2k,
  Auto3k,
}

fn plan_image_size(
  aspect_ratio: Option<CommonAspectRatio>,
  resolution: Option<CommonResolution>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlannedImageSize>, ArtcraftRouterError> {
  use PlannedImageSize as S;
  match aspect_ratio {
    // No aspect_ratio: use resolution as a hint for Auto sizes.
    // Seedream v5 lite has no 4K — clamp to 3K.
    None => match resolution {
      Some(CommonResolution::TwoK) => Ok(Some(S::Auto2k)),
      Some(CommonResolution::ThreeK) | Some(CommonResolution::FourK) => Ok(Some(S::Auto3k)),
      _ => Ok(None),
    },

    Some(CommonAspectRatio::Auto) | Some(CommonAspectRatio::Auto2k) => Ok(Some(S::Auto2k)),
    Some(CommonAspectRatio::Auto3k) => Ok(Some(S::Auto3k)),
    // No 4K — fall back to 3K.
    Some(CommonAspectRatio::Auto4k) => Ok(Some(S::Auto3k)),

    Some(CommonAspectRatio::Square) => Ok(Some(S::Square)),
    Some(CommonAspectRatio::SquareHd) => Ok(Some(S::SquareHd)),

    Some(CommonAspectRatio::Wide) | Some(CommonAspectRatio::WideSixteenByNine) => Ok(Some(S::LandscapeSixteenNine)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(S::LandscapeFourThree)),

    Some(unsupported @ CommonAspectRatio::WideFiveByFour)
    | Some(unsupported @ CommonAspectRatio::WideThreeByTwo)
    | Some(unsupported @ CommonAspectRatio::WideTwentyOneByNine) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(S::LandscapeSixteenNine)),
    },

    Some(CommonAspectRatio::Tall) | Some(CommonAspectRatio::TallNineBySixteen) => Ok(Some(S::PortraitSixteenNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(S::PortraitFourThree)),

    Some(unsupported @ CommonAspectRatio::TallFourByFive)
    | Some(unsupported @ CommonAspectRatio::TallTwoByThree)
    | Some(unsupported @ CommonAspectRatio::TallNineByTwentyOne) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(S::PortraitSixteenNine)),
    },
  }
}

fn to_t2i_image_size(s: PlannedImageSize) -> EnqueueBytedanceSeedreamV5LiteTextToImageSize {
  use EnqueueBytedanceSeedreamV5LiteTextToImageSize as T;
  match s {
    PlannedImageSize::Square => T::Square,
    PlannedImageSize::SquareHd => T::SquareHd,
    PlannedImageSize::PortraitFourThree => T::PortraitFourThree,
    PlannedImageSize::PortraitSixteenNine => T::PortraitSixteenNine,
    PlannedImageSize::LandscapeFourThree => T::LandscapeFourThree,
    PlannedImageSize::LandscapeSixteenNine => T::LandscapeSixteenNine,
    PlannedImageSize::Auto2k => T::Auto2k,
    PlannedImageSize::Auto3k => T::Auto3k,
  }
}

fn to_edit_image_size(s: PlannedImageSize) -> EnqueueBytedanceSeedreamV5LiteEditImageSize {
  use EnqueueBytedanceSeedreamV5LiteEditImageSize as E;
  match s {
    PlannedImageSize::Square => E::Square,
    PlannedImageSize::SquareHd => E::SquareHd,
    PlannedImageSize::PortraitFourThree => E::PortraitFourThree,
    PlannedImageSize::PortraitSixteenNine => E::PortraitSixteenNine,
    PlannedImageSize::LandscapeFourThree => E::LandscapeFourThree,
    PlannedImageSize::LandscapeSixteenNine => E::LandscapeSixteenNine,
    PlannedImageSize::Auto2k => E::Auto2k,
    PlannedImageSize::Auto3k => E::Auto3k,
  }
}

// ── Image inputs ──

fn resolve_image_list_ref(
  image_list_ref: Option<ImageListRef>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match image_list_ref {
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
      model: CommonImageModel::Seedream5Lite,
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

  fn unwrap_t2i(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> EnqueueBytedanceSeedreamV5LiteTextToImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalSeedream5Lite(FalSeedream5LiteRequestState::TextToImage(req))
    ) = result.expect("build should succeed") else { panic!("expected TextToImage variant") };
    req
  }

  #[test]
  fn auto_maps_to_auto2k() {
    let builder = GenerateImageRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::Auto),
      ..base_builder()
    };
    let req = unwrap_t2i(build_fal_seedream_5_lite(builder));
    assert!(matches!(req.image_size, Some(EnqueueBytedanceSeedreamV5LiteTextToImageSize::Auto2k)));
  }

  #[test]
  fn auto4k_falls_back_to_auto3k() {
    // Seedream 5 Lite has no 4K — clamp to 3K.
    let builder = GenerateImageRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::Auto4k),
      ..base_builder()
    };
    let req = unwrap_t2i(build_fal_seedream_5_lite(builder));
    assert!(matches!(req.image_size, Some(EnqueueBytedanceSeedreamV5LiteTextToImageSize::Auto3k)));
  }

  #[test]
  fn no_aspect_no_resolution_yields_none() {
    let req = unwrap_t2i(build_fal_seedream_5_lite(base_builder()));
    assert!(req.image_size.is_none());
  }

  #[test]
  fn resolution_two_k_triggers_auto2k_when_no_aspect() {
    let builder = GenerateImageRequestBuilder {
      resolution: Some(CommonResolution::TwoK),
      ..base_builder()
    };
    let req = unwrap_t2i(build_fal_seedream_5_lite(builder));
    assert!(matches!(req.image_size, Some(EnqueueBytedanceSeedreamV5LiteTextToImageSize::Auto2k)));
  }

  #[test]
  fn resolution_four_k_clamps_to_auto3k() {
    let builder = GenerateImageRequestBuilder {
      resolution: Some(CommonResolution::FourK),
      ..base_builder()
    };
    let req = unwrap_t2i(build_fal_seedream_5_lite(builder));
    assert!(matches!(req.image_size, Some(EnqueueBytedanceSeedreamV5LiteTextToImageSize::Auto3k)));
  }

  #[test]
  fn media_tokens_return_error() {
    let builder = GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![])),
      ..base_builder()
    };
    assert!(matches!(
      build_fal_seedream_5_lite(builder),
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    ));
  }
}
