use gmicloud_client::requests::api::video::seedance_2_0_260128::api::Seedance20Request;

use crate::client::router_gmicloud_client::RouterGmiCloudClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  GenerateVideoResponse, GmiCloudVideoResponsePayload,
};

#[derive(Clone, Debug)]
pub struct GmiCloudSeedance2p0GRequestState {
  pub request: Seedance20Request,
}

impl GmiCloudSeedance2p0GRequestState {
  pub async fn send(&self, client: &RouterGmiCloudClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let response = self.request.send_request(&client.api_key)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::GmiCloud(err)))?;

    Ok(GenerateVideoResponse::GmiCloud(GmiCloudVideoResponsePayload {
      request_id: response.request_id,
    }))
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::client::router_client::RouterClient;
  use crate::client::router_gmicloud_client::RouterGmiCloudClient;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use gmicloud_client::creds::gmicloud_api_key::GmiCloudApiKey;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  #[tokio::test]
  #[ignore] // requires real API key, incurs costs
  async fn test_text_to_video_720p() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("A corgi running through a field of wildflowers at sunset.".to_string()),
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      resolution: Some(CommonResolution::SevenTwentyP),
      duration_seconds: Some(5),
      ..gmicloud_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::GmiCloud(_)));
  }

  #[tokio::test]
  #[ignore] // requires real API key, incurs costs
  async fn test_image_to_video_480p() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("The dog starts running and splashing in the lake.".to_string()),
      start_frame: Some(ImageRef::Url(JUNO_AT_LAKE_IMAGE_URL.to_string())),
      resolution: Some(CommonResolution::FourEightyP),
      duration_seconds: Some(5),
      ..gmicloud_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::GmiCloud(_)));
  }

  fn gmicloud_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0Global,
      provider: Provider::GmiCloud,
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn get_gmicloud_client() -> RouterClient {
    let secret = std::fs::read_to_string("/Users/bt/Artcraft/credentials/gmicloud_api_key.txt")
      .expect("Failed to read GmiCloud API key");
    let api_key = GmiCloudApiKey::from_str(&secret);
    RouterClient::GmiCloud(RouterGmiCloudClient::new(api_key))
  }

  async fn run_pipeline(builder: GenerateVideoRequestBuilder) -> GenerateVideoResponse {
    let client = get_gmicloud_client();
    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      VideoGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (GmiCloud skips draft)"),
    };
    let response = request.send_request(&client).await.expect("send_request should succeed");
    match &response {
      GenerateVideoResponse::GmiCloud(p) => println!("request_id={}", p.request_id),
      other => println!("response: {:?}", other),
    }
    response
  }
}
