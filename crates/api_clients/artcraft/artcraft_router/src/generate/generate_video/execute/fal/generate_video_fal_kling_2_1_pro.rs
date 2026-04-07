use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_kling_2_1_pro::PlanFalKling21Pro;
use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::{
  enqueue_kling_v2p1_pro_image_to_video_webhook, Kling2p1ProArgs,
};

pub async fn execute_fal_kling_2_1_pro(
  plan: &PlanFalKling21Pro,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let end_frame_image_url: Option<String> = plan.end_image_url.clone();

  let args = Kling2p1ProArgs {
    image_url: plan.image_url.as_str(),
    end_frame_image_url,
    webhook_url: fal_client.webhook_url.as_str(),
    prompt: plan.prompt.as_str(),
    api_key: &fal_client.api_key,
    duration: plan.duration,
    aspect_ratio: plan.aspect_ratio,
  };

  let webhook_response = enqueue_kling_v2p1_pro_image_to_video_webhook(args)
    .await
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}
