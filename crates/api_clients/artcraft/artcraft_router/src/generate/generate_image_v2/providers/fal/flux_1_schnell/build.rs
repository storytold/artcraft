use fal_client::requests::api::image::edit::flux_1_schnell_edit_image::api::{
  Flux1SchnellEditImageNumImages, Flux1SchnellEditImageRequest, Flux1SchnellEditImageSize,
};
use fal_client::requests::api::image::text::flux_1_schnell_text_to_image::api::{
  Flux1SchnellTextToImageAspectRatio, Flux1SchnellTextToImageNumImages,
  Flux1SchnellTextToImageRequest,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::fal::flux_1_schnell::request::FalFlux1SchnellRequestState;

pub fn build_fal_flux_1_schnell(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let prompt = builder.prompt.clone().unwrap_or_default();
  let num_images = plan_num_images(builder.image_batch_count, strategy)?;
  let image_url = resolve_single_image_url(builder.image_inputs.clone())?;

  let state = if let Some(url) = image_url {
    // Edit image (redux): single image URL, optional image_size, no prompt
    let image_size = plan_edit_image_size(builder.aspect_ratio);

    FalFlux1SchnellRequestState::EditImage(Flux1SchnellEditImageRequest {
      image_url: url,
      num_images: to_edit_num_images(num_images),
      image_size,
    })
  } else {
    // Text-to-image
    let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio);

    FalFlux1SchnellRequestState::TextToImage(Flux1SchnellTextToImageRequest {
      prompt,
      num_images: to_t2i_num_images(num_images),
      aspect_ratio,
    })
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalFlux1Schnell(state),
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

fn to_t2i_num_images(n: PlannedNumImages) -> Flux1SchnellTextToImageNumImages {
  match n {
    PlannedNumImages::One => Flux1SchnellTextToImageNumImages::One,
    PlannedNumImages::Two => Flux1SchnellTextToImageNumImages::Two,
    PlannedNumImages::Three => Flux1SchnellTextToImageNumImages::Three,
    PlannedNumImages::Four => Flux1SchnellTextToImageNumImages::Four,
  }
}

fn to_edit_num_images(n: PlannedNumImages) -> Flux1SchnellEditImageNumImages {
  match n {
    PlannedNumImages::One => Flux1SchnellEditImageNumImages::One,
    PlannedNumImages::Two => Flux1SchnellEditImageNumImages::Two,
    PlannedNumImages::Three => Flux1SchnellEditImageNumImages::Three,
    PlannedNumImages::Four => Flux1SchnellEditImageNumImages::Four,
  }
}

// ── Aspect ratio ──

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
) -> Flux1SchnellTextToImageAspectRatio {
  use Flux1SchnellTextToImageAspectRatio as T;
  match aspect_ratio {
    None | Some(CommonAspectRatio::Auto) | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k) | Some(CommonAspectRatio::Auto4k) => T::SquareHd,
    Some(CommonAspectRatio::Square) => T::Square,
    Some(CommonAspectRatio::SquareHd) => T::SquareHd,
    Some(CommonAspectRatio::WideFourByThree) | Some(CommonAspectRatio::WideFiveByFour)
    | Some(CommonAspectRatio::WideThreeByTwo) | Some(CommonAspectRatio::Wide) => T::LandscapeFourByThree,
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::WideTwentyOneByNine) => T::LandscapeSixteenByNine,
    Some(CommonAspectRatio::TallThreeByFour) | Some(CommonAspectRatio::TallFourByFive)
    | Some(CommonAspectRatio::TallTwoByThree) | Some(CommonAspectRatio::Tall) => T::PortraitThreeByFour,
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::TallNineByTwentyOne) => T::PortraitNineBySixteen,
  }
}

fn plan_edit_image_size(
  aspect_ratio: Option<CommonAspectRatio>,
) -> Option<Flux1SchnellEditImageSize> {
  use Flux1SchnellEditImageSize as S;
  aspect_ratio.and_then(|ar| match ar {
    CommonAspectRatio::Auto | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto3k | CommonAspectRatio::Auto4k => None,
    CommonAspectRatio::Square => Some(S::Square),
    CommonAspectRatio::SquareHd => Some(S::SquareHd),
    CommonAspectRatio::WideFourByThree | CommonAspectRatio::WideFiveByFour
    | CommonAspectRatio::WideThreeByTwo | CommonAspectRatio::Wide => Some(S::LandscapeFourByThree),
    CommonAspectRatio::WideSixteenByNine | CommonAspectRatio::WideTwentyOneByNine => Some(S::LandscapeSixteenByNine),
    CommonAspectRatio::TallThreeByFour | CommonAspectRatio::TallFourByFive
    | CommonAspectRatio::TallTwoByThree | CommonAspectRatio::Tall => Some(S::PortraitThreeByFour),
    CommonAspectRatio::TallNineBySixteen | CommonAspectRatio::TallNineByTwentyOne => Some(S::PortraitNineBySixteen),
  })
}

// ── Image inputs ──

/// Flux 1 Schnell redux takes exactly one image URL. v1 rejects multi-URL
/// inputs; match that strictness so cost parity holds across the full sweep.
fn resolve_single_image_url(
  image_inputs: Option<ImageListRef>,
) -> Result<Option<String>, ArtcraftRouterError> {
  match image_inputs {
    None => Ok(None),
    Some(ImageListRef::Urls(urls)) if urls.is_empty() => Ok(None),
    Some(ImageListRef::Urls(urls)) if urls.len() == 1 => Ok(Some(urls.into_iter().next().unwrap())),
    Some(ImageListRef::Urls(urls)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "image_inputs",
        value: format!("Flux 1 Schnell redux supports exactly 1 image, got {}", urls.len()),
      }))
    }
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
      model: CommonImageModel::Flux1Schnell,
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

  fn unwrap_t2i(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> Flux1SchnellTextToImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalFlux1Schnell(
        FalFlux1SchnellRequestState::TextToImage(req)
      )
    ) = result.expect("build should succeed") else {
      panic!("expected TextToImage variant")
    };
    req
  }

  fn unwrap_edit(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> Flux1SchnellEditImageRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalFlux1Schnell(
        FalFlux1SchnellRequestState::EditImage(req)
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
      let req = unwrap_t2i(build_fal_flux_1_schnell(base_builder()));
      assert_eq!(req.prompt, "a cat in space");
    }

    #[test]
    fn single_url_yields_edit_image() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_flux_1_schnell(builder));
      assert_eq!(req.image_url, "https://example.com/img.jpg");
    }

    #[test]
    fn multiple_urls_rejected_for_parity_with_v1() {
      // v1 hard-rejects >1 URL for Flux 1 Schnell redux. v2 mirrors that.
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec![
          "https://example.com/a.jpg".to_string(),
          "https://example.com/b.jpg".to_string(),
        ])),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_flux_1_schnell(builder),
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { field: "image_inputs", .. }))
      ));
    }

    #[test]
    fn empty_urls_yields_text_to_image() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec![])),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_flux_1_schnell(builder));
      assert_eq!(req.prompt, "a cat in space");
    }

    #[test]
    fn media_tokens_return_error() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::MediaFileTokens(vec![])),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_flux_1_schnell(builder),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }
  }

  // ── Num images ──

  mod num_images_tests {
    use super::*;

    #[test]
    fn default_is_one() {
      let req = unwrap_t2i(build_fal_flux_1_schnell(base_builder()));
      assert!(matches!(req.num_images, Flux1SchnellTextToImageNumImages::One));
    }

    #[test]
    fn explicit_three() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(3),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_flux_1_schnell(builder));
      assert!(matches!(req.num_images, Flux1SchnellTextToImageNumImages::Three));
    }

    #[test]
    fn zero_is_error() {
      let builder = GenerateImageRequestBuilder {
        image_batch_count: Some(0),
        ..base_builder()
      };
      assert!(matches!(
        build_fal_flux_1_schnell(builder),
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
        build_fal_flux_1_schnell(builder),
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
      let req = unwrap_t2i(build_fal_flux_1_schnell(builder));
      assert!(matches!(req.num_images, Flux1SchnellTextToImageNumImages::Four));
    }

    #[test]
    fn edit_mode_num_images() {
      let builder = GenerateImageRequestBuilder {
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        image_batch_count: Some(2),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_flux_1_schnell(builder));
      assert!(matches!(req.num_images, Flux1SchnellEditImageNumImages::Two));
    }
  }

  // ── Aspect ratio ──

  mod aspect_ratio_tests {
    use super::*;

    #[test]
    fn default_is_square_hd() {
      let req = unwrap_t2i(build_fal_flux_1_schnell(base_builder()));
      assert!(matches!(req.aspect_ratio, Flux1SchnellTextToImageAspectRatio::SquareHd));
    }

    #[test]
    fn square() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Square),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_flux_1_schnell(builder));
      assert!(matches!(req.aspect_ratio, Flux1SchnellTextToImageAspectRatio::Square));
    }

    #[test]
    fn wide_sixteen_by_nine() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_flux_1_schnell(builder));
      assert!(matches!(req.aspect_ratio, Flux1SchnellTextToImageAspectRatio::LandscapeSixteenByNine));
    }

    #[test]
    fn tall_nine_by_sixteen() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_flux_1_schnell(builder));
      assert!(matches!(req.aspect_ratio, Flux1SchnellTextToImageAspectRatio::PortraitNineBySixteen));
    }

    #[test]
    fn edit_auto_yields_none() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Auto),
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_flux_1_schnell(builder));
      assert!(req.image_size.is_none());
    }

    #[test]
    fn edit_square() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::Square),
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_flux_1_schnell(builder));
      assert!(matches!(req.image_size, Some(Flux1SchnellEditImageSize::Square)));
    }

    #[test]
    fn edit_landscape() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_flux_1_schnell(builder));
      assert!(matches!(req.image_size, Some(Flux1SchnellEditImageSize::LandscapeSixteenByNine)));
    }

    #[test]
    fn edit_no_aspect_ratio_yields_none() {
      let builder = GenerateImageRequestBuilder {
        aspect_ratio: None,
        image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
        ..base_builder()
      };
      let req = unwrap_edit(build_fal_flux_1_schnell(builder));
      assert!(req.image_size.is_none());
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
      let req = unwrap_t2i(build_fal_flux_1_schnell(builder));
      assert_eq!(req.prompt, "my custom prompt");
    }

    #[test]
    fn missing_prompt_defaults_to_empty() {
      let builder = GenerateImageRequestBuilder {
        prompt: None,
        ..base_builder()
      };
      let req = unwrap_t2i(build_fal_flux_1_schnell(builder));
      assert_eq!(req.prompt, "");
    }
  }
}
