use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v4_edit_image_webhook::{
  enqueue_bytedance_seedream_v4_edit_image_webhook, EnqueueBytedanceSeedreamV4EditImageArgs,
  EnqueueBytedanceSeedreamV4EditImageRequest,
};
use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v4_text_to_image_webhook::{
  enqueue_bytedance_seedream_v4_text_to_image_webhook, EnqueueBytedanceSeedreamV4TextToImageArgs,
  EnqueueBytedanceSeedreamV4TextToImageRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};

#[derive(Clone, Debug)]
pub enum FalSeedream4RequestState {
  TextToImage(EnqueueBytedanceSeedreamV4TextToImageRequest),
  EditImage(EnqueueBytedanceSeedreamV4EditImageRequest),
}

impl FalSeedream4RequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let (webhook_response, outbound): (_, Arc<dyn Debug + Send + Sync>) = match self {
      Self::TextToImage(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueBytedanceSeedreamV4TextToImageArgs {
          request: request.clone(),
          webhook_url: client.webhook_url.as_str(),
          api_key: &client.api_key,
        };
        (enqueue_bytedance_seedream_v4_text_to_image_webhook(args).await, outbound)
      }
      Self::EditImage(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueBytedanceSeedreamV4EditImageArgs {
          request: request.clone(),
          webhook_url: client.webhook_url.as_str(),
          api_key: &client.api_key,
        };
        (enqueue_bytedance_seedream_v4_edit_image_webhook(args).await, outbound)
      }
    };

    let webhook_response = webhook_response
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
  use fal_client::requests::webhook::image::edit::enqueue_bytedance_seedream_v4_edit_image_webhook::EnqueueBytedanceSeedreamV4EditImageNumImages;
  use fal_client::requests::webhook::image::text::enqueue_bytedance_seedream_v4_text_to_image_webhook::EnqueueBytedanceSeedreamV4TextToImageNumImages;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

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
  async fn send_t2i_via_webhook() {
    let client = client_with_webhook();
    let state = FalSeedream4RequestState::TextToImage(EnqueueBytedanceSeedreamV4TextToImageRequest {
      prompt: "a corgi wearing sunglasses on a surfboard".to_string(),
      num_images: Some(EnqueueBytedanceSeedreamV4TextToImageNumImages::One),
      max_images: None,
      image_size: None,
    });
    let response = state.send(&client).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    println!("seedream_4 t2i — request_id: {:?}", payload.request_id);
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_edit_via_webhook() {
    let client = client_with_webhook();
    let state = FalSeedream4RequestState::EditImage(EnqueueBytedanceSeedreamV4EditImageRequest {
      prompt: "make it sunset".to_string(),
      image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
      num_images: Some(EnqueueBytedanceSeedreamV4EditImageNumImages::One),
      max_images: None,
      image_size: None,
    });
    let response = state.send(&client).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    println!("seedream_4 edit — request_id: {:?}", payload.request_id);
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }
}
