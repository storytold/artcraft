use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::image::edit::nano_banana_2_edit_image::api::NanoBanana2EditImageRequest;
use fal_client::requests::api::image::text::nano_banana_2_text_to_image::api::NanoBanana2TextToImageRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};

#[derive(Clone, Debug)]
pub enum FalNanoBanana2RequestState {
  TextToImage(NanoBanana2TextToImageRequest),
  EditImage(NanoBanana2EditImageRequest),
}

impl FalNanoBanana2RequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      Self::TextToImage(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let payload = send_fal_request(request, client).await?;
        Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
          request_id: payload.request_id,
          gateway_request_id: payload.gateway_request_id,
          maybe_status_url: payload.status_url,
          maybe_response_url: payload.response_url,
          maybe_outbound_request: Some(outbound),
        }))
      }
      Self::EditImage(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let payload = send_fal_request(request, client).await?;
        Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
          request_id: payload.request_id,
          gateway_request_id: payload.gateway_request_id,
          maybe_status_url: payload.status_url,
          maybe_response_url: payload.response_url,
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
  status_url: Option<String>,
  response_url: Option<String>,
}

async fn send_fal_request<T: FalEndpoint>(
  request: &T,
  client: &RouterFalClient,
) -> Result<FalResponseIds, ArtcraftRouterError> {
  if let Some(webhook_url) = &client.webhook_url {
    let response = request
      .send_webhook_request(&client.api_key, webhook_url)
      .await?;
    Ok(FalResponseIds {
      request_id: response.request_id,
      gateway_request_id: response.gateway_request_id,
      status_url: None,
      response_url: None,
    })
  } else {
    let response = request
      .send_queue_request(&client.api_key)
      .await?;
    Ok(FalResponseIds {
      request_id: Some(response.request_id),
      gateway_request_id: None,
      status_url: Some(response.status_url),
      response_url: Some(response.response_url),
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use fal_client::creds::fal_api_key::FalApiKey;
  use fal_client::requests::api::image::edit::nano_banana_2_edit_image::api::{
    NanoBanana2EditImageAspectRatio, NanoBanana2EditImageNumImages,
    NanoBanana2EditImageResolution,
  };
  use fal_client::requests::api::image::text::nano_banana_2_text_to_image::api::{
    NanoBanana2TextToImageAspectRatio, NanoBanana2TextToImageNumImages,
    NanoBanana2TextToImageResolution,
  };
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  fn read_fal_api_key() -> FalApiKey {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")
      .expect("Failed to read fal_api_key.txt");
    FalApiKey::from_str(secret.trim())
  }

  fn client_with_webhook() -> RouterFalClient {
    RouterFalClient::new_with_webhook(
      read_fal_api_key(),
      "https://example.com/fal-webhook-test".to_string(),
    )
  }

  // ── Text-to-image ──

  mod text_to_image {
    use super::*;

    fn t2i_request() -> FalNanoBanana2RequestState {
      FalNanoBanana2RequestState::TextToImage(NanoBanana2TextToImageRequest {
        prompt: "a corgi wearing sunglasses on a surfboard".to_string(),
        num_images: NanoBanana2TextToImageNumImages::One,
        resolution: Some(NanoBanana2TextToImageResolution::OneK),
        aspect_ratio: Some(NanoBanana2TextToImageAspectRatio::SixteenByNine),
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
  }

  // ── Edit image ──

  mod edit_image {
    use super::*;
    use test_data::web::image_urls::WHITE_HOUSE_SUNSET_IMAGE_URL;

    fn edit_request() -> FalNanoBanana2RequestState {
      FalNanoBanana2RequestState::EditImage(NanoBanana2EditImageRequest {
        prompt: "add a party hat to the dog, and put the dog in front of the location".to_string(),
        image_urls: vec![
          JUNO_AT_LAKE_IMAGE_URL.to_string(),
          WHITE_HOUSE_SUNSET_IMAGE_URL.to_string(),
        ],
        num_images: NanoBanana2EditImageNumImages::One,
        resolution: Some(NanoBanana2EditImageResolution::OneK),
        aspect_ratio: Some(NanoBanana2EditImageAspectRatio::SixteenByNine),
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
  }
}
