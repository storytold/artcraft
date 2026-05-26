use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::video::image::enqueue_seedance_1p5_pro_image_to_video_webhook::{
  enqueue_seedance_1p5_pro_image_to_video_webhook, EnqueueSeedance1p5ProImageToVideoArgs,
  EnqueueSeedance1p5ProImageToVideoRequest,
};
use fal_client::requests::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  enqueue_seedance_1p5_pro_text_to_video_webhook, EnqueueSeedance1p5ProTextToVideoArgs,
  EnqueueSeedance1p5ProTextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalSeedance1p5ProMode {
  TextToVideo(EnqueueSeedance1p5ProTextToVideoRequest),
  ImageToVideo(EnqueueSeedance1p5ProImageToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalSeedance1p5ProRequestState {
  pub mode: FalSeedance1p5ProMode,
}

impl FalSeedance1p5ProRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalSeedance1p5ProMode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueSeedance1p5ProTextToVideoArgs {
          request: request.clone(),
          webhook_url: client.webhook_url.as_str(),
          api_key: &client.api_key,
        };
        (enqueue_seedance_1p5_pro_text_to_video_webhook(args).await, outbound)
      }
      FalSeedance1p5ProMode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueSeedance1p5ProImageToVideoArgs {
          request: request.clone(),
          webhook_url: client.webhook_url.as_str(),
          api_key: &client.api_key,
        };
        (enqueue_seedance_1p5_pro_image_to_video_webhook(args).await, outbound)
      }
    };

    let webhook_response = webhook_response
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

    Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
      request_id: webhook_response.request_id,
      gateway_request_id: webhook_response.gateway_request_id,
      maybe_outbound_request: Some(outbound_request),
    }))
  }
}
