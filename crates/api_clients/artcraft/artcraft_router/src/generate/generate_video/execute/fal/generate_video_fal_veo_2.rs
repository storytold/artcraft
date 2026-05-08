use std::fmt::Debug;
use std::sync::Arc;

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
  enqueue_veo_2_image_to_video_webhook, Veo2Args, Veo2AspectRatio, Veo2Request,
};
use fal_client::requests::webhook::video::text::enqueue_veo_2_text_to_video_webhook::{
  enqueue_veo_2_text_to_video_webhook, Veo2TextToVideoArgs, Veo2TextToVideoRequest,
};

pub async fn execute_fal_veo_2(
  plan: &PlanFalVeo2,
  fal_client: &RouterFalClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let (webhook_response, outbound_request) = match &plan.mode {
    FalVeo2Mode::TextToVideo => {
      let request = Veo2TextToVideoRequest {
        prompt: plan.prompt.clone(),
        negative_prompt: plan.negative_prompt.clone(),
        duration: plan.duration,
        aspect_ratio: plan.aspect_ratio.unwrap_or(Veo2AspectRatio::Auto),
      };
      let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
      let args = Veo2TextToVideoArgs {
        request,
        api_key: &fal_client.api_key,
        webhook_url: fal_client.webhook_url.as_str(),
      };
      let resp = enqueue_veo_2_text_to_video_webhook(args)
        .await
        .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
      (resp, outbound)
    }
    FalVeo2Mode::ImageToVideo { image_url } => {
      // Image-to-video does not support aspect_ratio — the output
      // inherits the source image's aspect ratio.
      let request = Veo2Request {
        image_url: image_url.to_string(),
        prompt: plan.prompt.clone(),
        duration: plan.duration,
      };
      let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
      let args = Veo2Args {
        request,
        api_key: &fal_client.api_key,
        webhook_url: fal_client.webhook_url.as_str(),
      };
      let resp = enqueue_veo_2_image_to_video_webhook(args)
        .await
        .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
      (resp, outbound)
    }
  };

  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: webhook_response.request_id,
    gateway_request_id: webhook_response.gateway_request_id,
    maybe_outbound_request: Some(outbound_request),
  }))
}
