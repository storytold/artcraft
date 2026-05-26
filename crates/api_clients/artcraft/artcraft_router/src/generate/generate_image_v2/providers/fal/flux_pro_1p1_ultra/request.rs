use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::image::text::enqueue_flux_pro_11_ultra_text_to_image_webhook::{
  enqueue_flux_pro_11_ultra_text_to_image_webhook, FluxPro11UltraArgs, FluxPro11UltraRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};

#[derive(Clone, Debug)]
pub struct FalFluxPro1p1UltraRequestState {
  pub request: FluxPro11UltraRequest,
}

impl FalFluxPro1p1UltraRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(self.request.clone());
    let args = FluxPro11UltraArgs {
      request: self.request.clone(),
      webhook_url: client.webhook_url.as_str(),
      api_key: &client.api_key,
    };
    let webhook_response = enqueue_flux_pro_11_ultra_text_to_image_webhook(args)
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
  use fal_client::requests::webhook::image::text::enqueue_flux_pro_11_ultra_text_to_image_webhook::{
    FluxPro11UltraAspectRatio, FluxPro11UltraNumImages,
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

  fn t2i_state() -> FalFluxPro1p1UltraRequestState {
    FalFluxPro1p1UltraRequestState {
      request: FluxPro11UltraRequest {
        prompt: "a corgi wearing sunglasses on a surfboard".to_string(),
        aspect_ratio: FluxPro11UltraAspectRatio::LandscapeSixteenByNine,
        num_images: FluxPro11UltraNumImages::One,
      },
    }
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_via_webhook() {
    let client = client_with_webhook();
    let response = t2i_state().send(&client).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    println!("Webhook t2i — request_id: {:?}, gateway_request_id: {:?}", payload.request_id, payload.gateway_request_id);
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }
}
