use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::generate::generate_image::generate_image_request::GenerateImageRequest;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

fn convert_model(
  model: &enums::common::generation::common_image_model::CommonImageModel,
) -> Result<artcraft_router::api::common_image_model::CommonImageModel, AdvancedCommonWebError> {
  let json = serde_json::to_string(model)?;
  serde_json::from_str(&json).map_err(|e| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported image model: {}", e),
    )
  })
}

fn convert_aspect_ratio(
  ar: &enums::common::generation::common_aspect_ratio::CommonAspectRatio,
) -> Result<artcraft_router::api::common_aspect_ratio::CommonAspectRatio, AdvancedCommonWebError> {
  let json = serde_json::to_string(ar)?;
  serde_json::from_str(&json).map_err(|e| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported aspect ratio: {}", e),
    )
  })
}

fn convert_resolution(
  res: &enums::common::generation::common_resolution::CommonResolution,
) -> Result<artcraft_router::api::common_resolution::CommonResolution, AdvancedCommonWebError> {
  let json = serde_json::to_string(res)?;
  serde_json::from_str(&json).map_err(|e| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported resolution: {}", e),
    )
  })
}

pub fn transform_request(
  request: &OmniGenImageCostAndGenerateRequest,
) -> Result<GenerateImageRequest<'_>, AdvancedCommonWebError> {
  let api_model = request.model.as_ref()
    .ok_or_else(|| AdvancedCommonWebError::BadInputWithSimpleMessage(
      "model is required".to_string(),
    ))?;

  let model = convert_model(api_model)?;

  let aspect_ratio = request.aspect_ratio.as_ref()
    .map(convert_aspect_ratio)
    .transpose()?;

  let resolution = request.resolution.as_ref()
    .map(convert_resolution)
    .transpose()?;

  Ok(GenerateImageRequest {
    model,
    provider: Provider::Artcraft,
    prompt: request.prompt.as_deref(),
    image_inputs: request.image_media_tokens.as_ref()
      .map(ImageListRef::MediaFileTokens),
    resolution: resolution,
    aspect_ratio: aspect_ratio,
    image_batch_count: request.image_batch_count,
    horizontal_angle: request.horizontal_angle,
    vertical_angle: request.vertical_angle,
    zoom: request.zoom,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    generation_mode_mismatch_strategy: None,
    idempotency_token: request.idempotency_token.as_deref(),
  })
}
