use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video_v2::providers::artcraft::request_common::send_artcraft_omni_request;

#[derive(Clone, Debug)]
pub struct ArtcraftHappyHorse1p0RequestState {
  pub request: OmniGenVideoCostAndGenerateRequest,
}

impl ArtcraftHappyHorse1p0RequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    send_artcraft_omni_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::client::router_artcraft_client::RouterArtcraftClient;
  use crate::client::router_client::RouterClient;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use artcraft_client::utils::api_host::ApiHost;

  use test_data::web::image_media_tokens::JUNO_AT_LAKE_PRODUCTION_MEDIA_TOKEN;

  mod aspect_ratio_tests {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn landscape() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A corgi running through a field of wildflowers at sunset.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..artcraft_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore]
    async fn portrait() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A cat sitting on a windowsill watching rain.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..artcraft_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore]
    async fn square() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A hummingbird hovering near a flower.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::Square),
        ..artcraft_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  mod resolution_tests {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn res_720p() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A golden retriever catching a frisbee on the beach.".to_string()),
        resolution: Some(CommonResolution::SevenTwentyP),
        ..artcraft_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore]
    async fn res_1080p() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A fox walking through a snowy forest.".to_string()),
        resolution: Some(CommonResolution::TenEightyP),
        ..artcraft_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  mod modality_tests {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn text_to_video() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A whale breaching in the open ocean at dawn, cinematic.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..artcraft_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore]
    async fn keyframe_start_frame() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("The dog watches the lake as the sun sets.".to_string()),
        start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new(JUNO_AT_LAKE_PRODUCTION_MEDIA_TOKEN.to_string()))),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..artcraft_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  // ── Helpers ──

  fn artcraft_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::HappyHorse1p0,
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
