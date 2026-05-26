use fal_client::requests::webhook::image::angle::enqueue_qwen_edit_2511_edit_image_angle_webhook::{
  EnqueueQwenEdit2511AngleImageSize, EnqueueQwenEdit2511AngleNumImages,
  EnqueueQwenEdit2511EditImageAngleRequest,
};

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image_v2::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image_v2::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image_v2::providers::fal::qwen_edit_2511_angles::request::FalQwenEdit2511AnglesRequestState;

pub fn build_fal_qwen_edit_2511_angles(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;
  let image_urls = resolve_image_urls(builder.image_inputs.clone())?;
  if image_urls.is_empty() {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "image_inputs",
      value: "Angle models require at least one input image URL".to_string(),
    }));
  }
  let num_images = plan_num_images(builder.image_batch_count, strategy)?;
  let image_size = plan_image_size(builder.aspect_ratio, strategy)?;

  let request = EnqueueQwenEdit2511EditImageAngleRequest {
    image_urls,
    horizontal_angle: builder.horizontal_angle,
    vertical_angle: builder.vertical_angle,
    zoom: builder.zoom,
    additional_prompt: builder.prompt.clone(),
    num_images: Some(num_images),
    image_size,
    lora_scale: None,
    guidance_scale: None,
    num_inference_steps: None,
  };

  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::FalQwenEdit2511Angles(FalQwenEdit2511AnglesRequestState { request }),
  ))
}

fn resolve_image_urls(image_inputs: Option<ImageListRef>) -> Result<Vec<String>, ArtcraftRouterError> {
  match image_inputs {
    None => Ok(vec![]),
    Some(ImageListRef::Urls(urls)) => Ok(urls),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn plan_num_images(
  image_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<EnqueueQwenEdit2511AngleNumImages, ArtcraftRouterError> {
  use EnqueueQwenEdit2511AngleNumImages as N;
  let count = image_batch_count.unwrap_or(1);
  match count {
    0 => Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations)),
    1 => Ok(N::One),
    2 => Ok(N::Two),
    3 => Ok(N::Three),
    4 => Ok(N::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "image_batch_count",
          value: format!("{}", count),
        }))
      }
      _ => Ok(N::Four),
    },
  }
}

fn plan_image_size(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<EnqueueQwenEdit2511AngleImageSize>, ArtcraftRouterError> {
  use EnqueueQwenEdit2511AngleImageSize as S;
  match aspect_ratio {
    None => Ok(None),

    Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => Ok(Some(S::SquareHd)),

    Some(CommonAspectRatio::Square) => Ok(Some(S::Square)),
    Some(CommonAspectRatio::SquareHd) => Ok(Some(S::SquareHd)),

    Some(CommonAspectRatio::Wide) | Some(CommonAspectRatio::WideSixteenByNine) => Ok(Some(S::LandscapeSixteenNine)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(S::LandscapeFourThree)),

    Some(CommonAspectRatio::Tall) | Some(CommonAspectRatio::TallNineBySixteen) => Ok(Some(S::PortraitSixteenNine)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(S::PortraitFourThree)),

    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      _ => Ok(Some(S::SquareHd)),
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;

  fn base() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: CommonImageModel::QwenEdit2511Angles,
      provider: Provider::Fal,
      prompt: Some("test".to_string()),
      image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/x.jpg".to_string()])),
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      horizontal_angle: Some(45.0),
      vertical_angle: Some(-15.0),
      zoom: Some(2.0),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }

  fn unwrap_request(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> EnqueueQwenEdit2511EditImageAngleRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::FalQwenEdit2511Angles(state)
    ) = result.expect("build should succeed") else {
      panic!("expected FalQwenEdit2511Angles variant")
    };
    state.request
  }

  #[test]
  fn passes_through_camera_params() {
    let req = unwrap_request(build_fal_qwen_edit_2511_angles(base()));
    assert_eq!(req.horizontal_angle, Some(45.0));
    assert_eq!(req.vertical_angle, Some(-15.0));
    assert_eq!(req.zoom, Some(2.0));
  }

  #[test]
  fn missing_image_inputs_errors() {
    let builder = GenerateImageRequestBuilder { image_inputs: None, ..base() };
    assert!(build_fal_qwen_edit_2511_angles(builder).is_err());
  }

  #[test]
  fn media_file_tokens_rejected() {
    use tokens::tokens::media_files::MediaFileToken;
    let builder = GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![MediaFileToken::new_from_str("mf_test")])),
      ..base()
    };
    assert!(matches!(
      build_fal_qwen_edit_2511_angles(builder),
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    ));
  }

  #[test]
  fn default_num_images_is_one() {
    let req = unwrap_request(build_fal_qwen_edit_2511_angles(base()));
    assert!(matches!(req.num_images, Some(EnqueueQwenEdit2511AngleNumImages::One)));
  }

  #[test]
  fn batch_zero_errors() {
    let builder = GenerateImageRequestBuilder { image_batch_count: Some(0), ..base() };
    assert!(matches!(
      build_fal_qwen_edit_2511_angles(builder),
      Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))
    ));
  }

  #[test]
  fn batch_over_four_clamps_with_upgrade() {
    let builder = GenerateImageRequestBuilder {
      image_batch_count: Some(9),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      ..base()
    };
    let req = unwrap_request(build_fal_qwen_edit_2511_angles(builder));
    assert!(matches!(req.num_images, Some(EnqueueQwenEdit2511AngleNumImages::Four)));
  }
}
