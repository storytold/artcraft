use std::sync::Arc;

use grok_api_client::api::requests::videos::video_generation::video_generation::{
  video_generation, VideoGenerationArgs, VideoGenerationRequest as GrokVideoGenerationRequest,
};

use crate::client::router_grok_api_client::RouterGrokApiClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  GenerateVideoResponse, GrokVideoResponsePayload,
};

#[derive(Clone, Debug)]
pub struct GrokApiGrokImagineVideoRequestState {
  /// The fully-resolved Grok request body. Doesn't carry the API key — that
  /// gets borrowed at send time from the router client.
  pub request: GrokVideoGenerationRequest,
}

impl GrokApiGrokImagineVideoRequestState {
  pub async fn send(&self, client: &RouterGrokApiClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let outbound_request = Arc::new(self.request.clone());

    let response = video_generation(VideoGenerationArgs {
      api_key: &client.api_key,
      request: self.request.clone(),
    })
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Grok(err)))?;

    Ok(GenerateVideoResponse::Grok(GrokVideoResponsePayload {
      request_id: response.request_id,
      maybe_outbound_request: Some(outbound_request),
    }))
  }
}

#[cfg(test)]
mod tests {
  use grok_api_client::creds::grok_api_key::GrokApiKey;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::client::router_client::RouterClient;
  use crate::client::router_grok_api_client::RouterGrokApiClient;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  #[tokio::test]
  #[ignore] // requires real API key, incurs costs
  async fn test_text_to_video_720p() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("A glowing crystal rocket launching from Mars.".to_string()),
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      resolution: Some(CommonResolution::SevenTwentyP),
      duration_seconds: Some(5),
      ..grok_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::Grok(_)));
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs costs
  async fn test_image_to_video_480p() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("The dog leaps into the lake and splashes around.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      resolution: Some(CommonResolution::FourEightyP),
      duration_seconds: Some(5),
      ..grok_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::Grok(_)));
  }

  fn grok_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::GrokImagineVideo,
      provider: Provider::GrokApi,
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn get_grok_client() -> RouterClient {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/grok_api_key.txt")
      .expect("Failed to read Grok API key");
    let api_key = GrokApiKey::new(secret.trim().to_string());
    RouterClient::GrokApi(RouterGrokApiClient::new(api_key))
  }

  async fn run_pipeline(builder: GenerateVideoRequestBuilder) -> GenerateVideoResponse {
    let client = get_grok_client();
    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      VideoGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Grok skips draft)"),
    };
    let response = request.send_request(&client).await.expect("send_request should succeed");
    match &response {
      GenerateVideoResponse::Grok(p) => println!("grok request_id={}", p.request_id),
      other => println!("unexpected response: {:?}", other),
    }
    response
  }
}
