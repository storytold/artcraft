use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
use crate::generate::generate_video::providers::artcraft::request_common::send_artcraft_omni_video_request;

#[derive(Clone, Debug)]
pub struct ArtcraftViduQ3RequestState {
  pub request: OmniGenVideoCostAndGenerateRequest,
}

impl ArtcraftViduQ3RequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    send_artcraft_omni_video_request(&self.request, client).await
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use artcraft_client::utils::api_host::ApiHost;
  use test_data::web::image_media_tokens::JUNO_AT_LAKE_PRODUCTION_MEDIA_TOKEN;

  use crate::api::image_ref::ImageRef;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::client::router_artcraft_client::RouterArtcraftClient;
  use crate::client::router_client::RouterClient;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  #[tokio::test]
  #[ignore] // sends a real generation to the Artcraft backend, incurs cost
  async fn text_to_video() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("A red kite soaring over coastal cliffs, cinematic.".to_string()),
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      ..artcraft_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // sends a real generation to the Artcraft backend, incurs cost
  async fn keyframe_start_frame() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("The dog stands up and walks toward the lake.".to_string()),
      start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new(JUNO_AT_LAKE_PRODUCTION_MEDIA_TOKEN.to_string()))),
      ..artcraft_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  #[tokio::test]
  #[ignore] // sends a real generation to the Artcraft backend, incurs cost
  async fn reference_images_to_video() {
    let response = run_pipeline(GenerateVideoRequestBuilder {
      prompt: Some("The dog explores a mossy forest clearing.".to_string()),
      reference_images: Some(ImageListRef::MediaFileTokens(vec![MediaFileToken::new(JUNO_AT_LAKE_PRODUCTION_MEDIA_TOKEN.to_string())])),
      ..artcraft_builder()
    }).await;
    assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
    assert_eq!(1, 2, "Inspect output above");
  }

  // ── Helpers ──

  fn artcraft_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::ViduQ3,
      provider: RouterProvider::Artcraft,
      duration_seconds: Some(5),
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
