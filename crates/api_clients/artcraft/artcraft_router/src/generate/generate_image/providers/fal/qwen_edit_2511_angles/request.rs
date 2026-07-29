use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::image::angle::qwen_edit_2511_edit_image_angle::api::QwenEdit2511EditImageAngleRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::{
  FalImageResponsePayload, GenerateImageResponse,
};

#[derive(Clone, Debug)]
pub struct FalQwenEdit2511AnglesRequestState {
  pub request: QwenEdit2511EditImageAngleRequest,
}

impl FalQwenEdit2511AnglesRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(self.request.clone());
    let payload = send_fal_request(&self.request, client).await?;
    Ok(GenerateImageResponse::Fal(FalImageResponsePayload {
      request_id: payload.request_id,
      gateway_request_id: payload.gateway_request_id,
      maybe_status_url: payload.status_url,
      maybe_response_url: payload.response_url,
      maybe_outbound_request: Some(outbound),
    }))
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
  use fal_client::requests::api::image::angle::qwen_edit_2511_edit_image_angle::api::{
    QwenEdit2511AngleImageSize, QwenEdit2511AngleNumImages,
  };
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_via_webhook() {
    let client = client_with_webhook();
    let state = FalQwenEdit2511AnglesRequestState {
      request: QwenEdit2511EditImageAngleRequest {
        image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
        horizontal_angle: Some(45.0),
        vertical_angle: Some(-15.0),
        zoom: Some(2.0),
        additional_prompt: Some("cinematic".to_string()),
        num_images: Some(QwenEdit2511AngleNumImages::One),
        image_size: Some(QwenEdit2511AngleImageSize::SquareHd),
        lora_scale: None,
        guidance_scale: None,
        num_inference_steps: None,
      },
    };
    let response = state.send(&client).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

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
}
