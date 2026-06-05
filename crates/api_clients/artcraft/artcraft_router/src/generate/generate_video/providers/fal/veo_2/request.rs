use std::fmt::Debug;
use std::sync::Arc;

use fal_client::requests_old::webhook::video::image::enqueue_veo_2_image_to_video_webhook::{
  enqueue_veo_2_image_to_video_webhook, Veo2Args, Veo2Request,
};
use fal_client::requests_old::webhook::video::text::enqueue_veo_2_text_to_video_webhook::{
  enqueue_veo_2_text_to_video_webhook, Veo2TextToVideoArgs, Veo2TextToVideoRequest,
};

use crate::client::router_fal_client::RouterFalClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  FalVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub enum FalVeo2Mode {
  TextToVideo(Veo2TextToVideoRequest),
  ImageToVideo(Veo2Request),
}

#[derive(Clone, Debug)]
pub struct FalVeo2RequestState {
  pub mode: FalVeo2Mode,
}

impl FalVeo2RequestState {
  pub async fn send(&self, client: &RouterFalClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let webhook_url = client.webhook_url.as_deref()
      .ok_or(ArtcraftRouterError::Client(ClientError::WebhookUrlRequired))?;
    let (webhook_response, outbound_request): (_, Arc<dyn Debug + Send + Sync>) = match &self.mode {
      FalVeo2Mode::TextToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = Veo2TextToVideoArgs {
          request: request.clone(),
          api_key: &client.api_key,
          webhook_url,
        };
        (enqueue_veo_2_text_to_video_webhook(args).await, outbound)
      }
      FalVeo2Mode::ImageToVideo(request) => {
        let outbound: Arc<dyn Debug + Send + Sync> = Arc::new(request.clone());
        let args = Veo2Args {
          request: request.clone(),
          api_key: &client.api_key,
          webhook_url,
        };
        (enqueue_veo_2_image_to_video_webhook(args).await, outbound)
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
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::test_helpers::get_fal_client;

  #[tokio::test]
  #[ignore]
  async fn live_text_to_video_5s() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("a peaceful lake at dawn".to_string()),
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      duration_seconds: Some(5),
      ..fal_veo_2_builder()
    }).await;
    println!("response: {:?}", response);
    assert!(matches!(response, GenerateVideoResponse::Fal(_)));
  }

  #[tokio::test]
  #[ignore]
  async fn live_image_to_video_7s() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("the dog leaps into the lake and splashes around.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      duration_seconds: Some(7),
      ..fal_veo_2_builder()
    }).await;
    println!("response: {:?}", response);
    assert!(matches!(response, GenerateVideoResponse::Fal(_)));
  }

  fn fal_veo_2_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo2,
      provider: RouterProvider::Fal,
      ..Default::default()
    }
  }

  async fn run_pipeline(builder: GenerateVideoRequestBuilder) -> GenerateVideoResponse {
    let client = get_fal_client();
    let draft_or_request = builder.build2().expect("build2");
    let request = match draft_or_request {
      VideoGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant"),
    };
    request.send_request(&client).await.expect("send_request")
  }
}
