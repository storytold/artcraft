use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::api::video::extend::veo_3p1_fast::api::Veo3p1FastExtendVideoRequest;
use fal_client::requests::api::video::image::veo_3p1_fast::api::Veo3p1FastImageToVideoRequest;
use fal_client::requests::api::video::images::veo_3p1_fast::api::Veo3p1FastFirstLastFrameToVideoRequest;
use fal_client::requests::api::video::reference::veo_3p1_fast::api::Veo3p1FastReferenceToVideoRequest;
use fal_client::requests::api::video::text::veo_3p1_fast::api::Veo3p1FastTextToVideoRequest;
use fal_client::requests::traits::fal_endpoint_trait::FalEndpoint;

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalVeo3p1FastMode {
  TextToVideo(Veo3p1FastTextToVideoRequest),
  ImageToVideo(Veo3p1FastImageToVideoRequest),
  FirstLastFrameToVideo(Veo3p1FastFirstLastFrameToVideoRequest),
  ReferenceToVideo(Veo3p1FastReferenceToVideoRequest),
  ExtendVideo(Veo3p1FastExtendVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalVeo3p1FastRequestState {
  pub mode: FalVeo3p1FastMode,
}

impl FalVeo3p1FastRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    match &self.mode {
      FalVeo3p1FastMode::TextToVideo(request) => send_request(request, client).await,
      FalVeo3p1FastMode::ImageToVideo(request) => send_request(request, client).await,
      FalVeo3p1FastMode::FirstLastFrameToVideo(request) => send_request(request, client).await,
      FalVeo3p1FastMode::ReferenceToVideo(request) => send_request(request, client).await,
      FalVeo3p1FastMode::ExtendVideo(request) => send_request(request, client).await,
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
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;
  use test_data::web::video_urls::ANGRY_SHIBA_VIDEO_URL;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::video_list_ref::VideoListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::test_helpers::get_fal_client;

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn live_text_to_video_4s() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a candle flickering in the dark".to_string()),
      duration_seconds: Some(4),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn live_image_to_video_6s() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("the dog leaps into the lake.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      duration_seconds: Some(6),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn live_reference_to_video_4s() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("the dog runs across a sunlit meadow".to_string()),
      reference_images: Some(ImageListRef::Urls(vec![JUNO_AT_LAKE_IMAGE_URL.to_string()])),
      duration_seconds: Some(4),
      generate_audio: Some(false),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs cost
  async fn live_extend_video_7s() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("the scene continues naturally, keeping the same motion and style".to_string()),
      reference_videos: Some(VideoListRef::Urls(vec![ANGRY_SHIBA_VIDEO_URL.to_string()])),
      duration_seconds: Some(7),
      generate_audio: Some(false),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  fn builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3p1Fast,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  async fn run_pipeline(b: GenerateVideoRequestBuilder) -> GenerateVideoResponse {
    let client = get_fal_client();
    let dor = b.build2().expect("build2");
    let req = match dor {
      VideoGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request"),
    };
    req.send_request(&client).await.expect("send")
  }
}
