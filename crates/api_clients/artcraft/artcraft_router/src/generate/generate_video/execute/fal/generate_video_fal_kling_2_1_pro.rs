use std::fmt::Debug;
use std::sync::Arc;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_1_pro::PlanFalKling21Pro;
use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::{
  enqueue_kling_v2p1_pro_image_to_video_webhook, Kling2p1ProArgs, Kling2p1ProRequest,
};

pub async fn execute_fal_kling_2_1_pro(
  plan: &PlanFalKling21Pro,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let request = Kling2p1ProRequest {
    image_url: plan.image_url.clone(),
    end_frame_image_url: plan.end_image_url.clone(),
    prompt: plan.prompt.clone(),
    duration: plan.duration,
    aspect_ratio: plan.aspect_ratio,
  };

  let outbound_request: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());

  let args = Kling2p1ProArgs {
    request,
    webhook_url: fal_client.webhook_url.as_str(),
    api_key: &fal_client.api_key,
  };

  let webhook_response = enqueue_kling_v2p1_pro_image_to_video_webhook(args)
    .await
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
    maybe_outbound_request: Some(outbound_request),
  }))
}
