use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::video::image::enqueue_kling_3p0_standard_image_to_video_webhook::{
  enqueue_kling_3p0_standard_image_to_video_webhook, EnqueueKling3p0StandardImageToVideoArgs,
  EnqueueKling3p0StandardImageToVideoRequest,
};
use fal_client::requests::webhook::video::text::enqueue_kling_3p0_standard_text_to_video_webhook::{
  enqueue_kling_3p0_standard_text_to_video_webhook, EnqueueKling3p0StandardTextToVideoArgs,
  EnqueueKling3p0StandardTextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalKling3p0StandardMode {
  TextToVideo(EnqueueKling3p0StandardTextToVideoRequest),
  ImageToVideo(EnqueueKling3p0StandardImageToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalKling3p0StandardRequestState {
  pub mode: FalKling3p0StandardMode,
}

impl FalKling3p0StandardRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalKling3p0StandardMode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueKling3p0StandardTextToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_kling_3p0_standard_text_to_video_webhook(args).await, outbound)
      }
      FalKling3p0StandardMode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueKling3p0StandardImageToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_kling_3p0_standard_image_to_video_webhook(args).await, outbound)
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
