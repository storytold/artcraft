use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests_old::webhook::video::image::enqueue_veo_3_image_to_video_webhook::{
  enqueue_veo_3_image_to_video_webhook, Veo3Args, Veo3Request,
};
use fal_client::requests_old::webhook::video::text::enqueue_veo_3_text_to_video_webhook::{
  enqueue_veo_3_text_to_video_webhook, Veo3TextToVideoArgs, Veo3TextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalVeo3Mode {
  TextToVideo(Veo3TextToVideoRequest),
  ImageToVideo(Veo3Request),
}

#[derive(Clone, Debug)]
pub struct FalVeo3RequestState {
  pub mode: FalVeo3Mode,
}

impl FalVeo3RequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalVeo3Mode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = Veo3TextToVideoArgs {
          request: request.clone(),
          api_key: &client.api_key,
          webhook_url,
        };
        (enqueue_veo_3_text_to_video_webhook(args).await, outbound)
      }
      FalVeo3Mode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = Veo3Args {
          request: request.clone(),
          api_key: &client.api_key,
          webhook_url,
        };
        (enqueue_veo_3_image_to_video_webhook(args).await, outbound)
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
  async fn live_text_to_video_720p_4s_audio_on() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a serene mountain landscape".to_string()),
      resolution: Some(RouterResolution::SevenTwentyP),
      duration_seconds: Some(4),
      generate_audio: Some(true),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore]
  async fn live_image_to_video_1080p_8s_no_audio() {
    let r = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("the dog leaps into the lake.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      resolution: Some(RouterResolution::TenEightyP),
      duration_seconds: Some(8),
      generate_audio: Some(false),
      ..builder()
    }).await;
    assert!(matches!(r, GenerateVideoResponse::Fal(_)));
  }

  fn builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3,
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
