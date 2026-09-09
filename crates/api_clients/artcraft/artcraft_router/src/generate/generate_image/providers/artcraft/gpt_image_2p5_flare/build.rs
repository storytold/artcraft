use enums::common::generation::common_image_model::CommonImageModel as CommonImageModelEnum;

use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;
use crate::generate::generate_image::providers::artcraft::build_common::build_artcraft_omni_image_request;
use crate::generate::generate_image::providers::artcraft::gpt_image_2p5_flare::request::ArtcraftGptImage2p5FlareRequestState;

pub fn build_artcraft_gpt_image_2p5_flare(
  builder: GenerateImageRequestBuilder,
) -> Result<ImageGenerationDraftOrRequest, ArtcraftRouterError> {
  let request = build_artcraft_omni_image_request(builder, CommonImageModelEnum::GptImage2p5Flare)?;
  Ok(ImageGenerationDraftOrRequest::Request(
    ImageGenerationRequest::ArtcraftGptImage2p5Flare(ArtcraftGptImage2p5FlareRequestState { request }),
  ))
}

#[cfg(test)]
mod tests {
  use super::*;
  use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
  use enums::common::generation::common_quality::CommonQuality as CommonQualityEnum;
  use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_quality::RouterQuality;
  use crate::api::router_resolution::RouterResolution;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::errors::client_error::ClientError;

  #[test]
  fn build2_routes_to_omni_request_with_flare_model() {
    let request = unwrap_request(base_builder().build2());
    assert_eq!(request.model, Some(CommonImageModelEnum::GptImage2p5Flare));
    assert_eq!(request.prompt.as_deref(), Some("a cat in space"));
    assert_eq!(request.image_batch_count, Some(1));
    assert!(request.image_media_tokens.is_none());
    assert!(request.aspect_ratio.is_none());
    assert!(request.resolution.is_none());
    assert!(request.quality.is_none());
    assert!(request.idempotency_token.is_some());
  }

  #[test]
  fn omni_request_carries_all_generation_fields() {
    let request = unwrap_request(GenerateImageRequestBuilder {
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      resolution: Some(RouterResolution::TwoK),
      quality: Some(RouterQuality::Medium),
      image_batch_count: Some(3),
      idempotency_token: Some("idem-123".to_string()),
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![MediaFileToken::generate(), MediaFileToken::generate()])),
      ..base_builder()
    }.build2());
    assert_eq!(request.aspect_ratio, Some(CommonAspectRatioEnum::WideSixteenByNine));
    assert_eq!(request.resolution, Some(CommonResolutionEnum::TwoK));
    assert_eq!(request.quality, Some(CommonQualityEnum::Medium));
    assert_eq!(request.image_batch_count, Some(3));
    assert_eq!(request.idempotency_token.as_deref(), Some("idem-123"));
    assert_eq!(request.image_media_tokens.map(|tokens| tokens.len()), Some(2));
  }

  #[test]
  fn batch_count_is_validated() {
    assert!(matches!(
      GenerateImageRequestBuilder { image_batch_count: Some(0), ..base_builder() }.build2(),
      Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))
    ));
    assert!(matches!(
      GenerateImageRequestBuilder { image_batch_count: Some(5), ..base_builder() }.build2(),
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
    let request = unwrap_request(GenerateImageRequestBuilder {
      image_batch_count: Some(5),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
      ..base_builder()
    }.build2());
    assert_eq!(request.image_batch_count, Some(4));
  }

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::GptImage2p5Flare,
      provider: RouterProvider::Artcraft,
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

  fn unwrap_request(result: Result<ImageGenerationDraftOrRequest, ArtcraftRouterError>) -> OmniGenImageCostAndGenerateRequest {
    let ImageGenerationDraftOrRequest::Request(
      ImageGenerationRequest::ArtcraftGptImage2p5Flare(state)
    ) = result.expect("build should succeed") else {
      panic!("expected Artcraft GPT Image 2.5 Flare request")
    };
    state.request
  }
}
