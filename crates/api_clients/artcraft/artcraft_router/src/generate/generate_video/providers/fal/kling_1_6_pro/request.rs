use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::video::elements::kling_1p6_pro_elements_to_video::api::Kling1p6ProElementsToVideoRequest;
use fal_client::requests::api::video::image::kling_1p6_pro_image_to_video::api::Kling1p6ProImageToVideoRequest;
use fal_client::requests::api::video::text::kling_1p6_pro_text_to_video::api::Kling1p6ProTextToVideoRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalKling16ProMode {
  TextToVideo(Kling1p6ProTextToVideoRequest),
  ImageToVideo(Kling1p6ProImageToVideoRequest),
  ElementsToVideo(Kling1p6ProElementsToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalKling16ProRequestState {
  pub mode: FalKling16ProMode,
}

impl FalKling16ProRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match &self.mode {
      FalKling16ProMode::TextToVideo(request) => send_request(request, client).await,
      FalKling16ProMode::ImageToVideo(request) => send_request(request, client).await,
      FalKling16ProMode::ElementsToVideo(request) => send_request(request, client).await,
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
  use fal_client::requests::api::video::elements::kling_1p6_pro_elements_to_video::api::{
    Kling1p6ProElementsToVideoAspectRatio, Kling1p6ProElementsToVideoDuration,
  };
  use fal_client::requests::api::video::image::kling_1p6_pro_image_to_video::api::{
    Kling1p6ProImageToVideoAspectRatio, Kling1p6ProImageToVideoDuration,
  };
  use fal_client::requests::api::video::text::kling_1p6_pro_text_to_video::api::{
    Kling1p6ProTextToVideoAspectRatio, Kling1p6ProTextToVideoDuration,
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

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_text_to_video_webhook() {
    let state = FalKling16ProRequestState {
      mode: FalKling16ProMode::TextToVideo(Kling1p6ProTextToVideoRequest {
        prompt: "a calm lake at sunrise".to_string(),
        negative_prompt: None,
        duration: Some(Kling1p6ProTextToVideoDuration::FiveSeconds),
        aspect_ratio: Some(Kling1p6ProTextToVideoAspectRatio::SixteenByNine),
        cfg_scale: None,
      }),
    };
    let response = state.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_image_to_video_webhook() {
    let state = FalKling16ProRequestState {
      mode: FalKling16ProMode::ImageToVideo(Kling1p6ProImageToVideoRequest {
        prompt: "the lake comes alive with gentle ripples".to_string(),
        image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
        end_image_url: None,
        negative_prompt: None,
        duration: Some(Kling1p6ProImageToVideoDuration::FiveSeconds),
        aspect_ratio: Some(Kling1p6ProImageToVideoAspectRatio::SixteenByNine),
        cfg_scale: None,
      }),
    };
    let response = state.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn send_elements_to_video_webhook() {
    let state = FalKling16ProRequestState {
      mode: FalKling16ProMode::ElementsToVideo(Kling1p6ProElementsToVideoRequest {
        prompt: "the elements come to life and dance".to_string(),
        input_image_urls: vec![JUNO_AT_LAKE_IMAGE_URL.to_string()],
        negative_prompt: None,
        duration: Some(Kling1p6ProElementsToVideoDuration::FiveSeconds),
        aspect_ratio: Some(Kling1p6ProElementsToVideoAspectRatio::SixteenByNine),
      }),
    };
    let response = state.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }
}
