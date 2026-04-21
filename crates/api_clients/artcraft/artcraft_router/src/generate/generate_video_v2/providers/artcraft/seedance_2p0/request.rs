use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0MultiFunctionVideoGenRequest;
use artcraft_client::endpoints::generate::video::multi_function::seedance_2p0_multi_function_video_gen::seedance_2p0_multi_function_video_gen;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub struct ArtcraftSeedance2p0RequestState {
  /// Final materialized request; ready to fire.
  pub request: Seedance2p0MultiFunctionVideoGenRequest,
}

impl ArtcraftSeedance2p0RequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let response = seedance_2p0_multi_function_video_gen(
      &client.api_host,
      Some(&client.credentials),
      self.request.clone(),
    )
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

    Ok(GenerateVideoResponse::Artcraft(ArtcraftVideoResponsePayload {
      inference_job_token: response.inference_job_token,
      all_inference_job_tokens: response.all_inference_job_tokens,
    }))
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::provider::Provider;
  use crate::client::router_artcraft_client::RouterArtcraftClient;
  use crate::client::router_client::RouterClient;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use artcraft_client::utils::api_host::ApiHost;

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn text_to_video_landscape() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("A corgi running through a field of wildflowers at sunset.".to_string()),
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      ..artcraft_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn text_to_video_1080p() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("A fox walking through a snowy forest.".to_string()),
      resolution: Some(CommonResolution::TenEightyP),
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      ..artcraft_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn artcraft_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      provider: Provider::Artcraft,
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

    let response = request.send_request(&client).await.expect("send_request should succeed");

    match &response {
      GenerateVideoResponse::Artcraft(p) => {
        println!("inference_job_token={:?}", p.inference_job_token);
        println!("all_inference_job_tokens={:?}", p.all_inference_job_tokens);
      }
      other => println!("response: {:?}", other),
    }

    response
  }
}
