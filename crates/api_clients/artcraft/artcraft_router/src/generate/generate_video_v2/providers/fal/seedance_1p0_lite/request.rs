use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::{
  enqueue_seedance_1_lite_image_to_video_webhook, Seedance1LiteArgs, Seedance1LiteRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub struct FalSeedance10LiteRequestState {
  pub request: Seedance1LiteRequest,
}

impl FalSeedance10LiteRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let outbound_request: Arc<dyn Debug + Send + Sync> = Arc::new(self.request.clone());

    let args = Seedance1LiteArgs {
      request: self.request.clone(),
      api_key: &client.api_key,
      webhook_url: client.webhook_url.as_str(),
    };

    let webhook_response = enqueue_seedance_1_lite_image_to_video_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

    Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
      request_id: webhook_response.request_id,
      gateway_request_id: webhook_response.gateway_request_id,
      maybe_outbound_request: Some(outbound_request),
    }))
  }
}
