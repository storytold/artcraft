use artcraft_api_defs::omni_api::generate_requests::omni_api_image_generate_request::OmniApiImageGenerateRequest;
use artcraft_router::api::router_aspect_ratio::RouterAspectRatio;
use artcraft_router::api::router_image_model::RouterImageModel;
use artcraft_router::api::router_quality::RouterQuality;
use artcraft_router::api::router_resolution::RouterResolution;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_image_model::CommonImageModel as CommonImageModelEnum;
use enums::common::generation::common_quality::CommonQuality as CommonQualityEnum;
use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::http_server::common_responses::common_web_error::CommonWebError;

pub fn hydrate_to_router_request(
  request: &OmniApiImageGenerateRequest,
) -> Result<GenerateImageRequestBuilder, CommonWebError> {
  let api_model = request.model.as_ref()
    .ok_or_else(|| CommonWebError::BadInputWithSimpleMessage(
      "model is required".to_string(),
    ))?;

  let model = convert_model(api_model)?;

  let aspect_ratio = request.aspect_ratio.as_ref()
    .map(convert_aspect_ratio)
    .transpose()?;

  let resolution = request.resolution.as_ref()
    .map(convert_resolution)
    .transpose()?;

  let quality = request.quality.as_ref()
    .map(convert_quality)
    .transpose()?;

  Ok(GenerateImageRequestBuilder {
    model,
    provider: RouterProvider::Artcraft,
    prompt: request.prompt.clone(),
    image_inputs: request.image_media_tokens.clone()
      .map(ImageListRef::MediaFileTokens),
    resolution,
    aspect_ratio,
    quality,
    image_batch_count: request.image_batch_count,
    horizontal_angle: request.adjust_horizontal_angle,
    vertical_angle: request.adjust_vertical_angle,
    zoom: request.adjust_zoom,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    generation_mode_mismatch_strategy: None,
    idempotency_token: request.idempotency_token.clone(),
  })
}

fn convert_model(
  model: &CommonImageModelEnum,
) -> Result<RouterImageModel, CommonWebError> {
  let json = serde_json::to_string(model)?;
  serde_json::from_str(&json).map_err(|e| {
    CommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported image model: {}", e),
    )
  })
}

fn convert_aspect_ratio(
  ar: &CommonAspectRatioEnum,
) -> Result<RouterAspectRatio, CommonWebError> {
  let json = serde_json::to_string(ar)?;
  serde_json::from_str(&json).map_err(|e| {
    CommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported aspect ratio: {}", e),
    )
  })
}

fn convert_resolution(
  res: &CommonResolutionEnum,
) -> Result<RouterResolution, CommonWebError> {
  let json = serde_json::to_string(res)?;
  serde_json::from_str(&json).map_err(|e| {
    CommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported resolution: {}", e),
    )
  })
}

fn convert_quality(
  quality: &CommonQualityEnum,
) -> Result<RouterQuality, CommonWebError> {
  let json = serde_json::to_string(quality)?;
  serde_json::from_str(&json).map_err(|e| {
    CommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported quality: {}", e),
    )
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use artcraft_router::api::router_image_model::RouterImageModel;
  use enums::common::generation::common_image_model::CommonImageModel as CommonImageModelEnum;

  #[test]
  fn gpt_image_2p5_models_convert_to_router_models() {
    assert_eq!(convert_model(&CommonImageModelEnum::GptImage2p5Flare).unwrap(), RouterImageModel::GptImage2p5Flare);
    assert_eq!(convert_model(&CommonImageModelEnum::GptImage2p5Sunburst).unwrap(), RouterImageModel::GptImage2p5Sunburst);
  }

  #[test]
  fn gpt_image_2p5_request_hydrates_to_artcraft_router_builder() {
    let request = OmniApiImageGenerateRequest {
      image_urls: None,
      idempotency_token: Some("idem".to_string()),
      model: Some(CommonImageModelEnum::GptImage2p5Sunburst),
      prompt: Some("a cat in space".to_string()),
      image_media_tokens: None,
      resolution: Some(CommonResolutionEnum::TwoK),
      aspect_ratio: Some(CommonAspectRatioEnum::WideSixteenByNine),
      quality: Some(CommonQualityEnum::Medium),
      image_batch_count: Some(2),
      adjust_horizontal_angle: None,
      adjust_vertical_angle: None,
      adjust_zoom: None,
    };
    let builder = hydrate_to_router_request(&request).unwrap();
    assert_eq!(builder.model, RouterImageModel::GptImage2p5Sunburst);
    assert!(matches!(builder.provider, RouterProvider::Artcraft));
    assert_eq!(builder.prompt.as_deref(), Some("a cat in space"));
    assert_eq!(format!("{:?}", builder.resolution), "Some(TwoK)");
    assert_eq!(format!("{:?}", builder.aspect_ratio), "Some(WideSixteenByNine)");
    assert_eq!(format!("{:?}", builder.quality), "Some(Medium)");
    assert_eq!(builder.image_batch_count, Some(2));
  }
}
