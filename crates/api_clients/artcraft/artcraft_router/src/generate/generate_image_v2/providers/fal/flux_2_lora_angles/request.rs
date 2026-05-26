use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::image::angle::enqueue_flux_2_lora_edit_image_angle_webhook::{
  enqueue_flux_2_lora_edit_image_angle_webhook, EnqueueFlux2LoraEditImageAngleArgs,
  EnqueueFlux2LoraEditImageAngleRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};

#[derive(Clone, Debug)]
pub struct FalFlux2LoraAnglesRequestState {
  pub request: EnqueueFlux2LoraEditImageAngleRequest,
}

impl FalFlux2LoraAnglesRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(self.request.clone());
    let args = EnqueueFlux2LoraEditImageAngleArgs {
      request: self.request.clone(),
      webhook_url: client.webhook_url.as_str(),
      api_key: &client.api_key,
    };
    let webhook_response = enqueue_flux_2_lora_edit_image_angle_webhook(args)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

    Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
      request_id: webhook_response.request_id,
      gateway_request_id: webhook_response.gateway_request_id,
      maybe_status_url: None,
      maybe_response_url: None,
      maybe_outbound_request: Some(outbound),
    }))
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use fal_client::creds::fal_api_key::FalApiKey;
  use fal_client::requests::webhook::image::angle::enqueue_flux_2_lora_edit_image_angle_webhook::{
    EnqueueFlux2LoraAngleImageSize, EnqueueFlux2LoraAngleNumImages,
  };

  fn read_fal_api_key() -> FalApiKey {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")
      .expect("Failed to read fal_api_key.txt");
    FalApiKey::from_str(secret.trim())
  }

  fn client_with_webhook() -> RouterFalClient {
    RouterFalClient::new(
      read_fal_api_key(),
      "https://example.com/fal-webhook-test".to_string(),
    )
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_via_webhook() {
    let client = client_with_webhook();
    let state = FalFlux2LoraAnglesRequestState {
      request: EnqueueFlux2LoraEditImageAngleRequest {
        image_urls: vec!["https://example.com/test.jpg".to_string()],
        horizontal_angle: Some(45.0),
        vertical_angle: Some(-15.0),
        zoom: Some(2.0),
        num_images: Some(EnqueueFlux2LoraAngleNumImages::One),
        image_size: Some(EnqueueFlux2LoraAngleImageSize::SquareHd),
        lora_scale: None,
        guidance_scale: None,
        num_inference_steps: None,
      },
    };
    let response = state.send(&client).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }
}
