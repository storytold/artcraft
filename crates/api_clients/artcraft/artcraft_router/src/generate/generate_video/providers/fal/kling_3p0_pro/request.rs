use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests_old::webhook::video::image::enqueue_kling_3p0_pro_image_to_video_webhook::{
  enqueue_kling_3p0_pro_image_to_video_webhook, EnqueueKling3p0ProImageToVideoArgs,
  EnqueueKling3p0ProImageToVideoRequest,
};
use fal_client::requests_old::webhook::video::text::enqueue_kling_3p0_pro_text_to_video_webhook::{
  enqueue_kling_3p0_pro_text_to_video_webhook, EnqueueKling3p0ProTextToVideoArgs,
  EnqueueKling3p0ProTextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalKling3p0ProMode {
  TextToVideo(EnqueueKling3p0ProTextToVideoRequest),
  ImageToVideo(EnqueueKling3p0ProImageToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalKling3p0ProRequestState {
  pub mode: FalKling3p0ProMode,
}

impl FalKling3p0ProRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalKling3p0ProMode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueKling3p0ProTextToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_kling_3p0_pro_text_to_video_webhook(args).await, outbound)
      }
      FalKling3p0ProMode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueKling3p0ProImageToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_kling_3p0_pro_image_to_video_webhook(args).await, outbound)
      }
    };

    let webhook_response = webhook_response
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

    Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
      request_id: webhook_response.request_id,
      gateway_request_id: webhook_response.gateway_request_id,
      maybe_status_url: None,
      maybe_response_url: None,
      maybe_outbound_request: Some(outbound_request),
    }))
  }
}
