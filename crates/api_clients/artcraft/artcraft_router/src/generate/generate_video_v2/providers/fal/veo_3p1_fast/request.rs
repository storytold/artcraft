use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests::webhook::video::image::enqueue_veo_3p1_fast_first_last_frame_image_to_video_webhook::{
  enqueue_veo_3p1_fast_first_last_frame_image_to_video_webhook,
  EnqueueVeo3p1FastFirstLastFrameImageToVideoArgs,
  EnqueueVeo3p1FastFirstLastFrameImageToVideoRequest,
};
use fal_client::requests::webhook::video::image::enqueue_veo_3p1_fast_image_to_video_webhook::{
  enqueue_veo_3p1_fast_image_to_video_webhook, EnqueueVeo3p1FastImageToVideoArgs,
  EnqueueVeo3p1FastImageToVideoRequest,
};
use fal_client::requests::webhook::video::text::enqueue_veo_3p1_fast_text_to_video_webhook::{
  enqueue_veo_3p1_fast_text_to_video_webhook, EnqueueVeo3p1FastTextToVideoArgs,
  EnqueueVeo3p1FastTextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalVeo3p1FastMode {
  TextToVideo(EnqueueVeo3p1FastTextToVideoRequest),
  ImageToVideo(EnqueueVeo3p1FastImageToVideoRequest),
  FirstLastFrame(EnqueueVeo3p1FastFirstLastFrameImageToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalVeo3p1FastRequestState {
  pub mode: FalVeo3p1FastMode,
}

impl FalVeo3p1FastRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalVeo3p1FastMode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueVeo3p1FastTextToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_veo_3p1_fast_text_to_video_webhook(args).await, outbound)
      }
      FalVeo3p1FastMode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueVeo3p1FastImageToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_veo_3p1_fast_image_to_video_webhook(args).await, outbound)
      }
      FalVeo3p1FastMode::FirstLastFrame(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueVeo3p1FastFirstLastFrameImageToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_veo_3p1_fast_first_last_frame_image_to_video_webhook(args).await, outbound)
      }
    };

    let webhook_response = webhook_response
      .map_err(|e| ArtcraftRouterError::Provider(ProviderError::Fal(e)))?;

    Ok(GenerateVideoResponse::Fal(FalVideoResponsePayload {
      request_id: webhook_response.request_id,
      gateway_request_id: webhook_response.gateway_request_id,
      maybe_outbound_request: Some(outbound_request),
    }))
  }
}

#[cfg(test)]
mod tests {
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::test_helpers::get_fal_client;

  #[tokio::test]
  #[ignore]
  async fn live_text_to_video_4s() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a candle flickering in the dark".to_string()),
      duration_seconds: Some(4),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore]
  async fn live_image_to_video_6s() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("the dog leaps into the lake.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      duration_seconds: Some(6),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  fn builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo3p1Fast,
      provider: Provider::Fal,
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
