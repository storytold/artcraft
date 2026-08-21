use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::video::image::veo_3_fast::api::Veo3FastImageToVideoRequest;
use fal_client::requests::api::video::text::veo_3_fast::api::Veo3FastTextToVideoRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalVeo3FastMode {
  TextToVideo(Veo3FastTextToVideoRequest),
  ImageToVideo(Veo3FastImageToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalVeo3FastRequestState {
  pub mode: FalVeo3FastMode,
}

impl FalVeo3FastRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match &self.mode {
      FalVeo3FastMode::TextToVideo(request) => send_request(request, client).await,
      FalVeo3FastMode::ImageToVideo(request) => send_request(request, client).await,
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
  use fal_client::requests::api::video::image::veo_3_fast::api::{
    Veo3FastImageToVideoDuration, Veo3FastImageToVideoResolution,
  };
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn live_image_to_video_720p_4s_audio() {
    let state = FalVeo3FastRequestState {
      mode: FalVeo3FastMode::ImageToVideo(Veo3FastImageToVideoRequest {
        prompt: "the dog leaps into the lake.".to_string(),
        image_url: JUNO_AT_LAKE_IMAGE_URL.to_string(),
        aspect_ratio: None,
        duration: Some(Veo3FastImageToVideoDuration::FourSeconds),
        resolution: Some(Veo3FastImageToVideoResolution::SevenTwentyP),
        generate_audio: Some(true),
        negative_prompt: None,
        seed: None,
        auto_fix: None,
        safety_tolerance: None,
      }),
    };
    let response = state.send(&client_with_webhook()).await.expect("send should succeed");
    assert!(matches!(response, GenerateVideoResponse::Fal(_)));
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
