use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::video::image::veo_3p1_lite::api::Veo3p1LiteImageToVideoRequest;
use fal_client::requests::api::video::images::veo_3p1_lite::api::Veo3p1LiteFirstLastFrameToVideoRequest;
use fal_client::requests::api::video::text::veo_3p1_lite::api::Veo3p1LiteTextToVideoRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalVeo3p1LiteMode {
  TextToVideo(Veo3p1LiteTextToVideoRequest),
  ImageToVideo(Veo3p1LiteImageToVideoRequest),
  FirstLastFrameToVideo(Veo3p1LiteFirstLastFrameToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalVeo3p1LiteRequestState {
  pub mode: FalVeo3p1LiteMode,
}

impl FalVeo3p1LiteRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match &self.mode {
      FalVeo3p1LiteMode::TextToVideo(request) => send_request(request, client).await,
      FalVeo3p1LiteMode::ImageToVideo(request) => send_request(request, client).await,
      FalVeo3p1LiteMode::FirstLastFrameToVideo(request) => send_request(request, client).await,
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
  use fal_client::creds::fal_api_key::FalApiKey;
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};

  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::fal::veo_3p1_lite::build::build_fal_veo_3p1_lite_state;

  use super::*;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn live_text_to_video_4s() {
    let state = build_state(GenerateVideoRequestBuilder {
      prompt: Some("a candle flickering in the dark".to_string()),
      duration_seconds: Some(4),
      generate_audio: Some(false),
      ..builder()
    });
    let response = state.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn live_image_to_video_4s() {
    let state = build_state(GenerateVideoRequestBuilder {
      prompt: Some("the dog leaps into the lake.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      duration_seconds: Some(4),
      generate_audio: Some(false),
      ..builder()
    });
    let response = state.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn live_first_last_frame_4s() {
    let state = build_state(GenerateVideoRequestBuilder {
      prompt: Some("a smooth transition between scenes".to_string()),
      start_frame: Some(ImageRef::Url(TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string())),
      end_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      duration_seconds: Some(4),
      generate_audio: Some(false),
      ..builder()
    });
    let response = state.send(&client_with_webhook()).await.expect("send should succeed");
    let payload = response.get_fal_payload().expect("expected Fal payload");
    assert!(payload.request_id.is_some() || payload.gateway_request_id.is_some());
  }

  fn builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3p1Lite,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  fn build_state(b: GenerateVideoRequestBuilder) -> FalVeo3p1LiteRequestState {
    build_fal_veo_3p1_lite_state(b).expect("build state")
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
