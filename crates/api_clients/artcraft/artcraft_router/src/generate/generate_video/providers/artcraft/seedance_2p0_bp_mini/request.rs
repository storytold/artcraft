use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::providers::artcraft::request_common::send_artcraft_omni_video_request;

#[derive(Clone, Debug)]
pub struct ArtcraftSeedance2p0BytePlusMiniRequestState {
  pub request: OmniGenVideoCostAndGenerateRequest,
}

impl ArtcraftSeedance2p0BytePlusMiniRequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    send_artcraft_omni_video_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::router_artcraft_client::RouterArtcraftClient;
  use crate::client::router_client::RouterClient;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use artcraft_client::utils::api_host::ApiHost;

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn text_to_video() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("A corgi running through a field of wildflowers at sunset.".to_string()),
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      ..mini_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn res_480p() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("A shiba inu playing in autumn leaves.".to_string()),
      resolution: Some(RouterResolution::FourEightyP),
      ..mini_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  fn mini_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0BytePlusMini,
      provider: RouterProvider::Artcraft,
      duration_seconds: Some(4),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn get_artcraft_client() -> RouterClient {
    let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/artcraft_cookies.txt")
      .expect("Failed to read artcraft cookies");
    let cookies = cookies.trim().to_string();
    let credentials = StorytellerCredentialSet::parse_multi_cookie_header(&cookies)
      .expect("Failed to parse cookies")
      .expect("No credentials found");
    RouterClient::Artcraft(RouterArtcraftClient::new(ApiHost::Storyteller, credentials))
  }

  async fn run_pipeline(builder: GenerateVideoRequestBuilder) -> GenerateVideoResponse {
    let client = get_artcraft_client();
    let draft_or_request = builder.build2().expect("build2 should succeed");
    let request = match draft_or_request {
      VideoGenerationDraftOrRequest::Request(r) => r,
      _ => panic!("expected Request variant (Artcraft skips draft)"),
    };
    request.send_request(&client).await.expect("send_request should succeed")
  }
}
