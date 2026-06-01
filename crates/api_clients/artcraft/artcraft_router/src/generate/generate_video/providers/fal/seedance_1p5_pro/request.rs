use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests_old::webhook::video::image::enqueue_seedance_1p5_pro_image_to_video_webhook::{
  enqueue_seedance_1p5_pro_image_to_video_webhook, EnqueueSeedance1p5ProImageToVideoArgs,
  EnqueueSeedance1p5ProImageToVideoRequest,
};
use fal_client::requests_old::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{
  enqueue_seedance_1p5_pro_text_to_video_webhook, EnqueueSeedance1p5ProTextToVideoArgs,
  EnqueueSeedance1p5ProTextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalSeedance1p5ProMode {
  TextToVideo(EnqueueSeedance1p5ProTextToVideoRequest),
  ImageToVideo(EnqueueSeedance1p5ProImageToVideoRequest),
}

#[derive(Clone, Debug)]
pub struct FalSeedance1p5ProRequestState {
  pub mode: FalSeedance1p5ProMode,
}

impl FalSeedance1p5ProRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalSeedance1p5ProMode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueSeedance1p5ProTextToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_seedance_1p5_pro_text_to_video_webhook(args).await, outbound)
      }
      FalSeedance1p5ProMode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = EnqueueSeedance1p5ProImageToVideoArgs {
          request: request.clone(),
          webhook_url,
          api_key: &client.api_key,
        };
        (enqueue_seedance_1p5_pro_image_to_video_webhook(args).await, outbound)
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

  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::test_helpers::get_fal_client;

  // ── Live integration tests (require Fal credentials, incur costs) ──

  #[tokio::test]
  #[ignore] // requires real API key, incurs costs
  async fn live_text_to_video_720p_5s() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a serene mountain landscape at sunrise.".to_string()),
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      resolution: Some(RouterResolution::SevenTwentyP),
      duration_seconds: Some(5),
      generate_audio: Some(true),
      ..fal_seedance_1p5_pro_builder()
    }).await;
    println!("response: {:?}", response);
    assert!(matches!(response, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs costs
  async fn live_text_to_video_1080p_no_audio() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a city street bustling with people".to_string()),
      resolution: Some(RouterResolution::TenEightyP),
      duration_seconds: Some(5),
      generate_audio: Some(false),
      ..fal_seedance_1p5_pro_builder()
    }).await;
    println!("response: {:?}", response);
    assert!(matches!(response, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs costs
  async fn live_image_to_video_720p_5s() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("the dog leaps into the lake and splashes around.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      resolution: Some(RouterResolution::SevenTwentyP),
      duration_seconds: Some(5),
      ..fal_seedance_1p5_pro_builder()
    }).await;
    println!("response: {:?}", response);
    assert!(matches!(response, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs costs
  async fn live_image_to_video_with_end_frame() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a smooth transition between two scenes".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      end_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      duration_seconds: Some(5),
      ..fal_seedance_1p5_pro_builder()
    }).await;
    println!("response: {:?}", response);
    assert!(matches!(response, GenerateVideoResponse::Fal(_)));
  }

  fn fal_seedance_1p5_pro_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance1p5Pro,
      provider: RouterProvider::Fal,
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  async fn run_pipeline(builder: GenerateVideoRequestBuilder) -> GenerateVideoResponse {
    let client = get_fal_client();
    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      VideoGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Fal skips draft)"),
    };
    let response = request.send_request(&client).await.expect("send_request should succeed");
    match &response {
      GenerateVideoResponse::Fal(p) => println!("fal request_id={:?}", p.request_id),
      other => println!("unexpected response: {:?}", other),
    }
    response
  }
}
