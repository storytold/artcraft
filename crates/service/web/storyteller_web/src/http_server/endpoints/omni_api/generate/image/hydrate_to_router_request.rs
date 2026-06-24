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
