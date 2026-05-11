use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::image::edit::nano_banana_pro_edit_image::api::NanoBananaProEditImageRequest;
use fal_client::requests::api::image::text::nano_banana_pro_text_to_image::api::NanoBananaProTextToImageRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};

#[derive(Clone, Debug)]
pub enum FalNanoBananaProRequestState {
  TextToImage(NanoBananaProTextToImageRequest),
  EditImage(NanoBananaProEditImageRequest),
}

impl FalNanoBananaProRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      Self::TextToImage(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let response = request
          .send_webhook_request(&client.api_key, &client.webhook_url)
          .await
          .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
        Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
          request_id: response.request_id,
          gateway_request_id: response.gateway_request_id,
          maybe_outbound_request: Some(outbound),
        }))
      }
      Self::EditImage(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let response = request
          .send_webhook_request(&client.api_key, &client.webhook_url)
          .await
          .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
        Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
          request_id: response.request_id,
          gateway_request_id: response.gateway_request_id,
          maybe_outbound_request: Some(outbound),
        }))
      }
    }
  }
}
