use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::video::image::enqueue_kling_v2p6_pro_image_to_video_webhook::{
  enqueue_kling_v2p6_pro_image_to_video_webhook, EnqueueKlingV2p6ProImageToVideoArgs,
  EnqueueKlingV2p6ProImageToVideoRequest,
};
use fal_client::requests::webhook::video::text::enqueue_kling_v2p6_pro_text_to_video_webhook::{
  enqueue_kling_v2p6_pro_text_to_video_webhook, EnqueueKlingV2p6ProTextToVideoArgs,
  EnqueueKlingV2p6ProTextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalKling2p6ProMode {
  TextToVideo(EnqueueKlingV2p6ProTextToVideoRequest),
  ImageToVideo(EnqueueKlingV2p6ProImageToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalKling2p6ProRequestState {
  pub mode: FalKling2p6ProMode,
}

impl FalKling2p6ProRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalKling2p6ProMode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueKlingV2p6ProTextToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_kling_v2p6_pro_text_to_video_webhook(args).await, outbound)
      }
      FalKling2p6ProMode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueKlingV2p6ProImageToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_kling_v2p6_pro_image_to_video_webhook(args).await, outbound)
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
