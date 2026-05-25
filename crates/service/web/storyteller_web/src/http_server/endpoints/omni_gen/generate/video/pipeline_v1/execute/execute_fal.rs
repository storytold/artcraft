//! Fal provider execution path.

use log::warn;

use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::build_router_client::build_router_client;
use crate::state::server_state::ServerState;

/// Execute generation via Fal (the existing path).
pub(crate) async fn execute_generation_fal(
  plan: &VideoGenerationPlan,
  server_state: &ServerState,
) -> Result<GenerateVideoResponse, CommonWebError> {
  const USE_ALTERNATE_KINOVI: bool = false;

  let router_client = build_router_client(Provider::Fal, server_state, USE_ALTERNATE_KINOVI)?;

  let response = plan.generate_video(&router_client)
    .await
    .map_err(|e| {
      warn!("Video generation failed (Fal): {:?}", e);
      CommonWebError::from_error(e)
    })?;

  Ok(response)
}
