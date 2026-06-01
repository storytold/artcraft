use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::video::image::enqueue_kling_v2p5_turbo_pro_image_to_video_webhook::{
  enqueue_kling_v2p5_turbo_pro_image_to_video_webhook, EnqueueKlingV2p5TurboProImageToVideoArgs,
  EnqueueKlingV2p5TurboProImageToVideoRequest,
};
use fal_client::requests::webhook::video::text::enqueue_kling_v2p5_turbo_pro_text_to_video_webhook::{
  enqueue_kling_v2p5_turbo_pro_text_to_video_webhook, EnqueueKlingV2p5TurboProTextToVideoArgs,
  EnqueueKlingV2p5TurboProTextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalKling2p5TurboProMode {
  TextToVideo(EnqueueKlingV2p5TurboProTextToVideoRequest),
  ImageToVideo(EnqueueKlingV2p5TurboProImageToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalKling2p5TurboProRequestState {
  pub mode: FalKling2p5TurboProMode,
}

impl FalKling2p5TurboProRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalKling2p5TurboProMode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueKlingV2p5TurboProTextToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_kling_v2p5_turbo_pro_text_to_video_webhook(args).await, outbound)
      }
      FalKling2p5TurboProMode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueKlingV2p5TurboProImageToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_kling_v2p5_turbo_pro_image_to_video_webhook(args).await, outbound)
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
