use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::fal::plan_generate_video_fal_veo_2::{
  FalVeo2Mode, PlanFalVeo2,
};
use fal_client::requests::webhook::video::image::enqueue_veo_2_image_to_video_webhook::{
  enqueue_veo_2_image_to_video_webhook, Veo2Args, Veo2AspectRatio,
};
use fal_client::requests::webhook::video::text::enqueue_veo_2_text_to_video_webhook::{
  enqueue_veo_2_text_to_video_webhook, Veo2TextToVideoArgs,
};

pub async fn execute_fal_veo_2(
  plan: &PlanFalVeo2,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let webhook_response = match &plan.mode {
    FalVeo2Mode::TextToVideo => {
      let args = Veo2TextToVideoArgs {
        prompt: plan.prompt.as_str(),
        negative_prompt: plan.negative_prompt.as_deref(),
        api_key: &fal_client.api_key,
        duration: plan.duration,
        aspect_ratio: plan.aspect_ratio.unwrap_or(Veo2AspectRatio::Auto),
        webhook_url: fal_client.webhook_url.as_str(),
      };
      enqueue_veo_2_text_to_video_webhook(args)
        .await
        .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
    }
    FalVeo2Mode::ImageToVideo { image_url } => {
      // Image-to-video does not support aspect_ratio — the output
      // inherits the source image's aspect ratio.
      let args = Veo2Args {
        image_url: image_url.as_str(),
        prompt: plan.prompt.as_str(),
        api_key: &fal_client.api_key,
        duration: plan.duration,
        webhook_url: fal_client.webhook_url.as_str(),
      };
      enqueue_veo_2_image_to_video_webhook(args)
        .await
        .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?
    }
  };

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
  }))
}
