use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_seedance_1_0_lite::PlanFalSeedance10Lite;
use fal_client::requests::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::{
  enqueue_seedance_1_lite_image_to_video_webhook, Seedance1LiteArgs,
};

pub async fn execute_fal_seedance_1_0_lite(
  plan: &PlanFalSeedance10Lite,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let end_frame: Option<&str> = plan.end_image_url.as_deref();

  let args = Seedance1LiteArgs {
    image_url: plan.image_url.as_str(),
    end_frame_image_url: end_frame,
    prompt: plan.prompt.as_str(),
    duration: plan.duration,
    resolution: plan.resolution,
    aspect_ratio: plan.aspect_ratio,
    camera_fixed: false,
    seed: None,
    api_key: &fal_client.api_key,
    webhook_url: fal_client.webhook_url.as_str(),
  };

  let webhook_response = enqueue_seedance_1_lite_image_to_video_webhook(args)
    .await
    .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}
