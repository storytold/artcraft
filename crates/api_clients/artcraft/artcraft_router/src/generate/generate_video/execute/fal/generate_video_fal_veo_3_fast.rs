use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3_fast::PlanFalVeo3Fast;
use fal_client::requests::webhook::video::image::enqueue_veo_3_fast_image_to_video_webhook::{
  enqueue_veo_3_fast_image_to_video_webhook, Veo3FastArgs,
};

pub async fn execute_fal_veo_3_fast(
  plan: &PlanFalVeo3Fast,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let args = Veo3FastArgs {
    prompt: plan.prompt.as_str(),
    image_url: plan.start_frame_url.as_str(),
    duration: plan.duration,
    api_key: &fal_client.api_key,
    resolution: plan.resolution,
    generate_audio: plan.generate_audio,
    webhook_url: fal_client.webhook_url.as_str(),
  };

  let webhook_response = enqueue_veo_3_fast_image_to_video_webhook(args)
    .await
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}
