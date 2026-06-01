use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests_old::webhook::video::image::enqueue_veo_3p1_first_last_frame_image_to_video_webhook::{
  enqueue_veo_3p1_first_last_frame_image_to_video_webhook, EnqueueVeo3p1FirstLastFrameImageToVideoArgs,
  EnqueueVeo3p1FirstLastFrameImageToVideoRequest,
};
use fal_client::requests_old::webhook::video::image::enqueue_veo_3p1_image_to_video_webhook::{
  enqueue_veo_3p1_image_to_video_webhook, EnqueueVeo3p1ImageToVideoArgs, EnqueueVeo3p1ImageToVideoRequest,
};
use fal_client::requests_old::webhook::video::text::enqueue_veo_3p1_text_to_video_webhook::{
  enqueue_veo_3p1_text_to_video_webhook, EnqueueVeo3p1TextToVideoArgs, EnqueueVeo3p1TextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalVeo3p1Mode {
  TextToVideo(EnqueueVeo3p1TextToVideoRequest),
  ImageToVideo(EnqueueVeo3p1ImageToVideoRequest),
  FirstLastFrame(EnqueueVeo3p1FirstLastFrameImageToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalVeo3p1RequestState {
  pub mode: FalVeo3p1Mode,
}

impl FalVeo3p1RequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalVeo3p1Mode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueVeo3p1TextToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_veo_3p1_text_to_video_webhook(args).await, outbound)
      }
      FalVeo3p1Mode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueVeo3p1ImageToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_veo_3p1_image_to_video_webhook(args).await, outbound)
      }
      FalVeo3p1Mode::FirstLastFrame(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueVeo3p1FirstLastFrameImageToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_veo_3p1_first_last_frame_image_to_video_webhook(args).await, outbound)
      }
    };

    let webhook_response = webhook_response
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

    Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
      request_id: webhook_response.request_id,
      gateway_request_id: webhook_response.gateway_request_id,
      maybe_status_url: None,
      maybe_response_url: None,
      maybe_outbound_request: Some(outbound_request),
    }))
  }
}

#[cfg(test)]
mod tests {
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::test_helpers::get_fal_client;

  #[tokio::test]
  #[ignore]
  async fn live_text_to_video_720p_4s() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a quiet meadow with wildflowers".to_string()),
      resolution: Some(RouterResolution::SevenTwentyP),
      duration_seconds: Some(4),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore]
  async fn live_image_to_video_8s() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("the dog leaps into the lake.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      duration_seconds: Some(8),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore]
  async fn live_first_last_frame() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a smooth transition between scenes".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      end_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      duration_seconds: Some(6),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  fn builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3p1,
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
