use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_mesh_cost_and_generate_request::OmniGenMeshCostAndGenerateRequest;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::router_mesh_model::RouterMeshModel;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use enums::common::generation::common_mesh_model::CommonMeshModel as CommonMeshModelEnum;

use crate::http_server::common_responses::common_web_error::CommonWebError;

pub fn hydrate_to_router_request(
  request: &OmniGenMeshCostAndGenerateRequest,
) -> Result<GenerateMeshRequestBuilder, CommonWebError> {
  let api_model = request.model
    .as_ref()
    .ok_or_else(|| CommonWebError::BadInputWithSimpleMessage(
      "model is required".to_string(),
    ))?;

  let model = convert_model(api_model)?;

  Ok(GenerateMeshRequestBuilder {
    model,
    provider: RouterProvider::Artcraft,
    prompt: request.prompt.clone(),
    reference_images: request.reference_image_media_tokens.clone()
      .map(ImageListRef::MediaFileTokens),
    front_image: request.front_image_media_token.clone()
      .map(ImageRef::MediaFileToken),
    back_image: request.back_image_media_token.clone()
      .map(ImageRef::MediaFileToken),
    left_image: request.left_image_media_token.clone()
      .map(ImageRef::MediaFileToken),
    right_image: request.right_image_media_token.clone()
      .map(ImageRef::MediaFileToken),
    mesh_output_type: request.mesh_output_type,
    polygon_type: request.polygon_type,
    face_count: request.face_count,
    enable_pbr: request.enable_pbr,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    idempotency_token: request.idempotency_token.clone(),
  })
}

fn convert_model(
  model: &CommonMeshModelEnum,
) -> Result<RouterMeshModel, CommonWebError> {
  let json = serde_json::to_string(model)?;
  serde_json::from_str(&json).map_err(|e| {
    CommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported mesh model: {}", e),
    )
  })
}
