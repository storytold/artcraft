use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::image::edit::flux_1_dev_edit_image::api::Flux1DevEditImageRequest;
use fal_client::requests::api::image::text::flux_1_dev_text_to_image::api::Flux1DevTextToImageRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_webhook_optional_client::RouterFalWebhookOptionalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};

#[derive(Clone, Debug)]
pub enum FalFlux1DevRequestState {
  TextToImage(Flux1DevTextToImageRequest),
  EditImage(Flux1DevEditImageRequest),
}

impl FalFlux1DevRequestState {
  pub async fn send(&self, client: &RouterFalWebhookOptionalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      Self::TextToImage(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let payload = send_fal_request(request, client).await?;
        Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
          request_id: payload.request_id,
          gateway_request_id: payload.gateway_request_id,
          maybe_outbound_request: Some(outbound),
        }))
      }
      Self::EditImage(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let payload = send_fal_request(request, client).await?;
        Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
          request_id: payload.request_id,
          gateway_request_id: payload.gateway_request_id,
          maybe_outbound_request: Some(outbound),
        }))
      }
    }
  }
}

// ── Helpers ──

struct FalResponseIds {
  request_id: Option<String>,
  gateway_request_id: Option<String>,
}

async fn send_fal_request<T: FalEndpoint>(
  request: &T,
  client: &RouterFalWebhookOptionalClient,
) -> Result<FalResponseIds, ArtcraftRouterError> {
  if let Some(webhook_url) = &client.webhook_url {
    let response = request
      .send_webhook_request(&client.api_key, webhook_url)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    Ok(FalResponseIds {
      request_id: response.request_id,
      gateway_request_id: response.gateway_request_id,
    })
  } else {
    let response = request
      .send_queue_request(&client.api_key)
      .await
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;
    Ok(FalResponseIds {
      request_id: Some(response.request_id),
      gateway_request_id: None,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use fal_client::creds::fal_api_key::FalApiKey;
  use fal_client::requests::api::image::edit::flux_1_dev_edit_image::api::Flux1DevEditImageNumImages;
  use fal_client::requests::api::image::text::flux_1_dev_text_to_image::api::{
    Flux1DevTextToImageAspectRatio, Flux1DevTextToImageNumImages,
  };
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  fn read_fal_api_key() -> FalApiKey {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")
      .expect("Failed to read fal_api_key.txt");
    FalApiKey::from_str(secret.trim())
  }

  fn client_with_webhook() -> RouterFalWebhookOptionalClient {
    RouterFalWebhookOptionalClient::new_with_webhook(
      read_fal_api_key(),
      "https://example.com/fal-webhook-test".to_string(),
    )
  }

  fn client_without_webhook() -> RouterFalWebhookOptionalClient {
    RouterFalWebhookOptionalClient::new(read_fal_api_key())
  }

  // ── Text-to-image ──

  mod text_to_image {
    use super::*;

    fn t2i_request() -> FalFlux1DevRequestState {
      FalFlux1DevRequestState::TextToImage(Flux1DevTextToImageRequest {
        prompt: "a corgi wearing sunglasses on a surfboard".to_string(),
        num_images: Flux1DevTextToImageNumImages::One,
        aspect_ratio: Flux1DevTextToImageAspectRatio::LandscapeSixteenByNine,
      })
    }

    #[tokio::test]
    #[ignore] // requires real API key, incurs cost
    async fn send_via_webhook() {
      let client = client_with_webhook();
      let state = t2i_request();
      let response = state.send(&client).await.expect("send should succeed");
      let payload = response.get_fal_payload().expect("expected Fal payload");
      println!("Webhook t2i — request_id: {:?}, gateway_request_id: {:?}", payload.request_id, payload.gateway_request_id);
      assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    }

    #[tokio::test]
    #[ignore] // requires real API key, incurs cost
    async fn send_via_queue() {
      let client = client_without_webhook();
      let state = t2i_request();
      let response = state.send(&client).await.expect("send should succeed");
      let payload = response.get_fal_payload().expect("expected Fal payload");
      println!("Queue t2i — request_id: {:?}", payload.request_id);
      assert!(payload.request_id.is_some());
    }
  }

  // ── Edit image ──

  mod edit_image {
    use super::*;

    fn edit_request() -> FalFlux1DevRequestState {
      FalFlux1DevRequestState::EditImage(Flux1DevEditImageRequest {
        prompt: "turn this into a watercolor painting".to_string(),
        image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
        num_images: Flux1DevEditImageNumImages::One,
      })
    }

    #[tokio::test]
    #[ignore] // requires real API key, incurs cost
    async fn send_via_webhook() {
      let client = client_with_webhook();
      let state = edit_request();
      let response = state.send(&client).await.expect("send should succeed");
      let payload = response.get_fal_payload().expect("expected Fal payload");
      println!("Webhook edit — request_id: {:?}, gateway_request_id: {:?}", payload.request_id, payload.gateway_request_id);
      assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
    }

    #[tokio::test]
    #[ignore] // requires real API key, incurs cost
    async fn send_via_queue() {
      let client = client_without_webhook();
      let state = edit_request();
      let response = state.send(&client).await.expect("send should succeed");
      let payload = response.get_fal_payload().expect("expected Fal payload");
      println!("Queue edit — request_id: {:?}", payload.request_id);
      assert!(payload.request_id.is_some());
    }
  }
}
