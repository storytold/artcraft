use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3::{
  FalVeo3Mode, PlanFalVeo3,
};
use fal_client::requests::webhook::video::image::enqueue_veo_3_image_to_video_webhook::{
  enqueue_veo_3_image_to_video_webhook, Veo3Args, Veo3AspectRatio,
};
use fal_client::requests::webhook::video::text::enqueue_veo_3_text_to_video_webhook::{
  enqueue_veo_3_text_to_video_webhook, Veo3TextToVideoArgs,
};

pub async fn execute_fal_veo_3(
  plan: &PlanFalVeo3,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalVeo3Mode::TextToVideo => {
      let args = Veo3TextToVideoArgs {
        prompt: plan.prompt.as_str(),
        negative_prompt: plan.negative_prompt.as_deref(),
        api_key: &fal_client.api_key,
        duration: plan.duration,
        aspect_ratio: plan.aspect_ratio.unwrap_or(Veo3AspectRatio::Default),
        resolution: plan.resolution,
        generate_audio: plan.generate_audio,
        webhook_url: fal_client.webhook_url.as_str(),
      };
      enqueue_veo_3_text_to_video_webhook(args)
        .await
        .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
    }
    FalVeo3Mode::ImageToVideo { image_url } => {
      let args = Veo3Args {
        image_url: image_url.as_str(),
        prompt: plan.prompt.as_str(),
        duration: plan.duration,
        aspect_ratio: plan.aspect_ratio.unwrap_or(Veo3AspectRatio::Default),
        resolution: plan.resolution,
        generate_audio: plan.generate_audio,
        api_key: &fal_client.api_key,
        webhook_url: fal_client.webhook_url.as_str(),
      };
      enqueue_veo_3_image_to_video_webhook(args)
        .await
        .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
    }
  };

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}
