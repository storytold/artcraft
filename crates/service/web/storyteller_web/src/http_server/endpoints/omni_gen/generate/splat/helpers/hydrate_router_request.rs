use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::api::router_splat_model::RouterSplatModel;
use artcraft_router::api::video_ref::VideoRef;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use enums::common::generation::common_splat_model::CommonSplatModel as CommonSplatModelEnum;

use crate::http_server::common_responses::common_web_error::CommonWebError;

pub fn hydrate_to_router_request(
  request: &OmniGenSplatCostAndGenerateRequest,
) -> Result<GenerateSplatRequestBuilder, CommonWebError> {
  let api_model = request.model
    .as_ref()
    .ok_or_else(|| CommonWebError::BadInputWithSimpleMessage(
      "model is required".to_string(),
    ))?;

  let model = convert_model(api_model)?;

  Ok(GenerateSplatRequestBuilder {
    model,
    provider: RouterProvider::Artcraft,
    prompt: request.prompt.clone(),
    reference_images: request.reference_image_media_tokens.clone()
      .map(ImageListRef::MediaFileTokens),
    reference_video: request.reference_video_media_token.clone()
      .map(VideoRef::MediaFileToken),
    is_panoramic: request.is_panoramic,
    disable_recaption: request.disable_recaption,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    idempotency_token: request.idempotency_token.clone(),
  })
}

fn convert_model(
  model: &CommonSplatModelEnum,
) -> Result<RouterSplatModel, CommonWebError> {
  let json = serde_json::to_string(model)?;
  serde_json::from_str(&json).map_err(|e| {
    CommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported splat model: {}", e),
    )
  })
}
