use fal_client::requests::webhook::image::edit::enqueue_gemini_25_flash_edit_webhook::{
  Gemini25FlashEditAspectRatio, Gemini25FlashEditNumImages, Gemini25FlashEditRequest,
};
use fal_client::requests::webhook::image::text::enqueue_gemini_25_flash_text_to_image_webhook::{
  Gemini25FlashTextToImageAspectRatio, Gemini25FlashTextToImageNumImages,
  Gemini25FlashTextToImageRequest,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::fal::nano_banana::request::FalNanoBananaRequestState;

pub fn build_fal_nano_banana(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;
  let image_urls = resolve_image_list_ref(builder.image_inputs.clone())?;
  let num_images = plan_num_images(builder.image_batch_count, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();

  let state = if image_urls.is_empty() {
    let aspect_ratio = plan_t2i_aspect_ratio(builder.aspect_ratio, strategy)?;
    FalNanoBananaRequestState::TextToImage(Gemini25FlashTextToImageRequest {
      prompt,
      num_images: to_t2i_num_images(num_images),
      aspect_ratio,
    })
  } else {
    let aspect_ratio = plan_edit_aspect_ratio(builder.aspect_ratio, strategy)?;
    FalNanoBananaRequestState::EditImage(Gemini25FlashEditRequest {
      prompt,
      image_urls,
      num_images: to_edit_num_images(num_images),
      aspect_ratio,
    })
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalNanoBanana(state),
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

fn to_t2i_num_images(n: PlannedNumImages) -> Gemini25FlashTextToImageNumImages {
  match n {
    PlannedNumImages::One => Gemini25FlashTextToImageNumImages::One,
    PlannedNumImages::Two => Gemini25FlashTextToImageNumImages::Two,
    PlannedNumImages::Three => Gemini25FlashTextToImageNumImages::Three,
    PlannedNumImages::Four => Gemini25FlashTextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: PlannedNumImages) -> Gemini25FlashEditNumImages {
  match n {
    PlannedNumImages::One => Gemini25FlashEditNumImages::One,
    PlannedNumImages::Two => Gemini25FlashEditNumImages::Two,
    PlannedNumImages::Three => Gemini25FlashEditNumImages::Three,
    PlannedNumImages::Four => Gemini25FlashEditNumImages::Four,
  }
}

// ── Aspect ratio ──

// Gemini 2.5 Flash text-to-image supported aspect ratios:
//   1:1, 5:4, 4:3, 3:2, 16:9, 21:9, 4:5, 3:4, 2:3, 9:16
//   (no Auto for text-to-image)
fn plan_t2i_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Gemini25FlashTextToImageAspectRatio>, ArtcraftRouterError> {
  use Gemini25FlashTextToImageAspectRatio as T;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(T::OneByOne)),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(T::OneByOne)),
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(T::FiveByFour)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(T::FourByThree)),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(T::ThreeByTwo)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(T::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(T::TwentyOneByNine)),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Some(T::FourByFive)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(T::ThreeByFour)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(T::TwoByThree)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(T::NineBySixteen)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(T::NineBySixteen)),
    },
  }
}

// Gemini 2.5 Flash image-edit supported aspect ratios: same as t2i plus Auto
fn plan_edit_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Gemini25FlashEditAspectRatio>, ArtcraftRouterError> {
  use Gemini25FlashEditAspectRatio as E;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(E::Auto)),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(E::OneByOne)),
    Some(CommonAspectRatio::WideFiveByFour) => Ok(Some(E::FiveByFour)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(E::FourByThree)),
    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(E::ThreeByTwo)),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(E::SixteenByNine)),
    Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(E::TwentyOneByNine)),
    Some(CommonAspectRatio::TallFourByFive) => Ok(Some(E::FourByFive)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(E::ThreeByFour)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(E::TwoByThree)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(E::NineBySixteen)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(E::NineBySixteen)),
    },
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
      model: CommonImageModel::NanoBanana,
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

  fn unwrap_t2i(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> Gemini25FlashTextToImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalNanoBanana(FalNanoBananaRequestState::TextToImage(req))
    ) = result.expect("build should succeed") else {
      panic!("expected TextToImage variant")
    };
    req
  }

  fn unwrap_edit(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> Gemini25FlashEditRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalNanoBanana(FalNanoBananaRequestState::EditImage(req))
    ) = result.expect("build should succeed") else {
      panic!("expected EditImage variant")
    };
    req
  }

  // ── Mode detection ──

  mod mode_detection {
    use super::*;

    #[test]
    fn no_image_inputs_yields_text_to_image() {
      let req = unwrap_t2i(build_fal_nano_banana(base_builder()));
      assert_eq!(req.prompt, "a cat in space");
    }

    #[test]
    fn image_inputs_yields_edit() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana(builder));
      assert_eq!(req.image_urls, vec!["https://example.com/img.jpg".to_string()]);
    }

    #[test]
    fn multiple_image_inputs_all_passed_through() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec![
          "https://example.com/a.jpg".to_string(),
          "https://example.com/b.jpg".to_string(),
        ])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana(builder));
      assert_eq!(req.image_urls.len(), 2);
    }

    #[test]
    fn empty_image_urls_yields_text_to_image() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec![])),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana(builder));
      assert_eq!(req.prompt, "a cat in space");
    }

    #[test]
    fn media_tokens_return_error() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::MediaFileTokens(vec![])),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_nano_banana(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }
  }

  // ── Aspect ratio ──

  mod aspect_ratio_tests {
    use super::*;

    #[test]
    fn t2i_default_is_none() {
      let req = unwrap_t2i(build_fal_nano_banana(base_builder()));
      assert!(req.aspect_ratio.is_none());
    }

    #[test]
    fn t2i_auto_falls_back_to_one_by_one() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Auto),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana(builder));
      assert!(matches!(req.aspect_ratio, Some(Gemini25FlashTextToImageAspectRatio::OneByOne)));
    }

    #[test]
    fn t2i_wide_sixteen_by_nine() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana(builder));
      assert!(matches!(req.aspect_ratio, Some(Gemini25FlashTextToImageAspectRatio::SixteenByNine)));
    }

    #[test]
    fn edit_auto_is_preserved() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        aspect_ratio: Some(CommonAspectRatio::Auto),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_nano_banana(builder));
      assert!(matches!(req.aspect_ratio, Some(Gemini25FlashEditAspectRatio::Auto)));
    }
  }

  // ── Num images ──

  mod num_images_tests {
    use super::*;

    #[test]
    fn default_is_one() {
      let req = unwrap_t2i(build_fal_nano_banana(base_builder()));
      assert!(matches!(req.num_images, Gemini25FlashTextToImageNumImages::One));
    }

    #[test]
    fn three_is_three() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(3),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana(builder));
      assert!(matches!(req.num_images, Gemini25FlashTextToImageNumImages::Three));
    }

    #[test]
    fn zero_is_error() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(0),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_nano_banana(builder),
        Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))
      ));
    }

    #[test]
    fn over_four_error_out() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(9),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_nano_banana(builder),
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "image_batch_count", .. }))
      ));
    }

    #[test]
    fn over_four_clamps_with_upgrade() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(9),
        request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_nano_banana(builder));
      assert!(matches!(req.num_images, Gemini25FlashTextToImageNumImages::Four));
    }
  }
}
