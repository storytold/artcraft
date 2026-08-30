use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::video::image::minimax_h3::api::MinimaxH3ImageToVideoRequest;
use fal_client::requests::api::video::reference::minimax_h3::api::MinimaxH3ReferenceToVideoRequest;
use fal_client::requests::api::video::text::minimax_h3::api::MinimaxH3TextToVideoRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalMinimaxH3Mode {
  TextToVideo(MinimaxH3TextToVideoRequest),
  ImageToVideo(MinimaxH3ImageToVideoRequest),
  ReferenceToVideo(MinimaxH3ReferenceToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalMinimaxH3RequestState {
  pub mode: FalMinimaxH3Mode,
}

impl FalMinimaxH3RequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match &self.mode {
      FalMinimaxH3Mode::TextToVideo(request) => send_request(request, client).await,
      FalMinimaxH3Mode::ImageToVideo(request) => send_request(request, client).await,
      FalMinimaxH3Mode::ReferenceToVideo(request) => send_request(request, client).await,
    }
  }
}

// ── Helpers ──

async fn send_request<T>(request: &T, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError>
where
  T: FalEndpoint + Clone + Debug + Send + Sync + 'static,
{
  let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
  let payload = send_fal_request(request, client).await?;
  Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
    request_id: payload.request_id,
    gateway_request_id: payload.gateway_request_id,
    maybe_status_url: payload.status_url,
    maybe_response_url: payload.response_url,
    maybe_outbound_request: Some(outbound),
  }))
}

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
  use fal_client::requests::api::video::text::minimax_h3::api::{
    MinimaxH3Resolution, MinimaxH3TextToVideoAspectRatio,
  };
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_text_to_video_webhook() {
    let state = FalMinimaxH3RequestState {
      mode: FalMinimaxH3Mode::TextToVideo(MinimaxH3TextToVideoRequest {
        prompt: "a calm lake at sunrise".to_string(),
        duration: Some(5),
        resolution: Some(MinimaxH3Resolution::SevenSixtyEightP),
        aspect_ratio: Some(MinimaxH3TextToVideoAspectRatio::SixteenByNine),
      }),
    };
    let response = state.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_image_to_video_webhook() {
    let state = FalMinimaxH3RequestState {
      mode: FalMinimaxH3Mode::ImageToVideo(MinimaxH3ImageToVideoRequest {
        prompt: "the lake comes alive".to_string(),
        image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
        end_image_url: None,
        duration: Some(5),
        resolution: Some(MinimaxH3Resolution::SevenSixtyEightP),
      }),
    };
    let response = state.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  // ── Helpers ──

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
