//! Fal provider execution path.

use log::warn;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use enums::common::generation::common_generation_mode::CommonGenerationMode;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::state::server_state::ServerState;

use super::super::distill_video_request::DistilledVideoRequest;
use super::execute_generation::GenerationResult;

/// Execute generation via Fal (the existing path).
pub(super) async fn execute_generation_fal(
  distilled: &DistilledVideoRequest,
  request: &OmniGenVideoCostAndGenerateRequest,
  server_state: &ServerState,
) -> Result<GenerationResult, AdvancedCommonWebError> {
  let fal_client = artcraft_router::client::router_fal_client::RouterFalClient::new(
    server_state.fal.api_key.clone(),
    server_state.fal.webhook_url.clone(),
  );
  let router_client = artcraft_router::client::router_client::RouterClient::Fal(fal_client);

  let generation_response = distilled.plan().generate_video(&router_client)
    .await
    .map_err(|e| {
      warn!("Video generation failed (Fal): {:?}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  let external_job_id = match &generation_response {
    GenerateVideoResponse::Artcraft(p) => p.inference_job_token.as_str().to_string(),
    GenerateVideoResponse::Muapi(p) => p.request_id.as_str().to_string(),
    GenerateVideoResponse::Seedance2Pro(p) => p.order_id.clone(),
    GenerateVideoResponse::Fal(p) => p.request_id.clone().unwrap_or_default(),
  };

  let generation_mode = if request.start_frame_image_media_token.is_some() {
    CommonGenerationMode::Keyframe
  } else {
    CommonGenerationMode::Text
  };

  Ok(GenerationResult {
    external_job_id,
    is_seedance2pro: false,
    maybe_seedance_order_ids: None,
    generation_mode,
  })
}
