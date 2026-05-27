use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::{
  enqueue_kling_v2p1_pro_image_to_video_webhook, Kling2p1ProArgs, Kling2p1ProRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub struct FalKling21ProRequestState {
  pub request: Kling2p1ProRequest,
}

impl FalKling21ProRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let outbound_request: Arc<dyn Debug + Send + Sync> = Arc::new(self.request.clone());

    let args = Kling2p1ProArgs {
      request: self.request.clone(),
      webhook_url,
      api_key: &client.api_key,
    };

    let webhook_response = enqueue_kling_v2p1_pro_image_to_video_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

    Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
      request_id: webhook_response.request_id,
      gateway_request_id: webhook_response.gateway_request_id,
      maybe_outbound_request: Some(outbound_request),
    }))
  }
}
