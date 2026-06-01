use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::image::edit::gpt_image_1p5_edit_image::api::GptImage1p5EditImageRequest;
use fal_client::requests::api::image::text::gpt_image_1p5_text_to_image::api::GptImage1p5TextToImageRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_image::generate_image_response::{FalImageResponsePayload, GenerateImageResponse};

#[derive(Clone, Debug)]
pub enum FalGptImage1p5RequestState {
  TextToImage(GptImage1p5TextToImageRequest),
  EditImage(GptImage1p5EditImageRequest),
}

impl FalGptImage1p5RequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateImageResponse, ArtcraftRouterError> {
    match self {
      Self::TextToImage(request) => send_request(request, client).await,
      Self::EditImage(request) => send_request(request, client).await,
    }
  }
}

struct FalResponseIds {
  request_id: Option<String>,
  gateway_request_id: Option<String>,
  status_url: Option<String>,
  response_url: Option<String>,
}

async fn send_request<T>(request: &T, client: &RouterFalClient) -> Result<GenerateImageResponse, ArtcraftRouterError>
where
  T: FalEndpoint + Clone + Debug + Send + Sync + 'static,
{
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

async fn send_fal_request<T: FalEndpoint>(
  request: &T,
  client: &RouterFalClient,
) -> Result<FalResponseIds, ArtcraftRouterError> {
  if let Some(webhook_url) = &client.webhook_url {
    let response = request.send_webhook_request(&client.api_key, webhook_url).await?;
    Ok(FalResponseIds {
      request_id: response.request_id,
      gateway_request_id: response.gateway_request_id,
      status_url: None,
      response_url: None,
    })
  } else {
    let response = request.send_queue_request(&client.api_key).await?;
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
  use fal_client::requests::api::image::edit::gpt_image_1p5_edit_image::api::{
    GptImage1p5EditImageNumImages, GptImage1p5EditImageQuality,
    GptImage1p5EditImageSize,
  };
  use fal_client::requests::api::image::text::gpt_image_1p5_text_to_image::api::{
    GptImage1p5TextToImageNumImages, GptImage1p5TextToImageQuality,
    GptImage1p5TextToImageSize,
  };
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  fn client_with_webhook() -> RouterFalClient {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")
      .expect("Failed to read fal_api_key.txt");
    RouterFalClient::new_with_webhook(
      FalApiKey::from_str(secret.trim()),
      "https://example.com/fal-webhook-test".to_string(),
    )
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_text_to_image_webhook() {
    let request = FalGptImage1p5RequestState::TextToImage(GptImage1p5TextToImageRequest {
      prompt: "a tiny brass observatory in a snowy field".to_string(),
      num_images: GptImage1p5TextToImageNumImages::One,
      image_size: Some(GptImage1p5TextToImageSize::Square),
      background: None,
      quality: Some(GptImage1p5TextToImageQuality::Low),
      output_format: None,
    });
    let response = request.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_edit_image_webhook() {
    let request = FalGptImage1p5RequestState::EditImage(GptImage1p5EditImageRequest {
      prompt: "turn this into a softly lit editorial photograph".to_string(),
      image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
      num_images: GptImage1p5EditImageNumImages::One,
      mask_image_url: None,
      image_size: Some(GptImage1p5EditImageSize::Square),
      background: None,
      quality: Some(GptImage1p5EditImageQuality::Low),
      input_fidelity: None,
      output_format: None,
    });
    let response = request.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }
}
