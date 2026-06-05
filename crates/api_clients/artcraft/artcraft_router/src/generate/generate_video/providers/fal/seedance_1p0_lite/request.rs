use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests_old::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::{
  enqueue_seedance_1_lite_image_to_video_webhook, Seedance1LiteArgs, Seedance1LiteRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub struct FalSeedance10LiteRequestState {
  pub request: Seedance1LiteRequest,
}

impl FalSeedance10LiteRequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let outbound_request: Arc<dyn Debug + Send + Sync> = Arc::new(self.request.clone());

    let args = Seedance1LiteArgs {
      request: self.request.clone(),
      api_key: &client.api_key,
      webhook_url,
    };

    let webhook_response = enqueue_seedance_1_lite_image_to_video_webhook(args)
      .await
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
  async fn live_image_to_video_720p_5s() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("the dog leaps into the lake and splashes around.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      resolution: Some(RouterResolution::SevenTwentyP),
      duration_seconds: Some(5),
      ..fal_seedance_1p0_lite_builder()
    }).await;
    println!("response: {:?}", response);
    assert!(matches!(response, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs costs
  async fn live_image_to_video_480p_10s() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a vivid splash of color filling the frame".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      resolution: Some(RouterResolution::FourEightyP),
      duration_seconds: Some(10),
      ..fal_seedance_1p0_lite_builder()
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
      ..fal_seedance_1p0_lite_builder()
    }).await;
    println!("response: {:?}", response);
    assert!(matches!(response, GenerateVideoResponse::Fal(_)));
  }

  fn fal_seedance_1p0_lite_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance10Lite,
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
