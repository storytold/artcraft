use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{GenerateVideoResponse, Seedance2proVideoResponsePayload};
use seedance2pro_client::requests::generate_video::generate_video::{generate_video, GenerateVideoArgs, KinoviGenerateVideoRequest};

#[derive(Debug, Clone)]
pub struct KinoviSeedance2p0FastRequestState {
  /// Final materialized request; ready to fire.
  pub request: KinoviGenerateVideoRequest,
}

impl KinoviSeedance2p0FastRequestState {
  pub async fn send(&self, client: &RouterSeedance2ProClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let session = &client.session;

    let args = GenerateVideoArgs {
      session,
      host_override: None,
      request: self.request.clone(), // TODO: Yuck.
    };

    let response = generate_video(args)
        .await
        .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

    Ok(GenerateVideoResponse::Seedance2Pro(Seedance2proVideoResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
    }))
  }
}

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use tokens::tokens::characters::CharacterToken;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::character_list_ref::CharacterListRef;
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::client::router_client::RouterClient;
  use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video_v2::video_generation_draft_context::VideoGenerationDraftContext;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;

  mod aspect_ratio_tests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn landscape() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A corgi running through a field of wildflowers at sunset.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..seedance2pro_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn portrait() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A cat sitting on a windowsill watching rain.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..seedance2pro_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn square() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A hummingbird hovering near a flower.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::Square),
        ..seedance2pro_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  mod resolution_tests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn res_480p() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A shiba inu playing in autumn leaves.".to_string()),
        resolution: Some(CommonResolution::FourEightyP),
        ..seedance2pro_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn res_720p() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A golden retriever catching a frisbee on the beach.".to_string()),
        resolution: Some(CommonResolution::SevenTwentyP),
        ..seedance2pro_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  mod modality_tests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn text_to_video() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A whale breaching in the open ocean at dawn, cinematic.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..seedance2pro_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn keyframe_start_and_end_frame() {
      let start_token = MediaFileToken::new("mf_start".to_string());
      let end_token = MediaFileToken::new("mf_end".to_string());

      let mut media_map = HashMap::new();
      media_map.insert(start_token.clone(), test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL.to_string());
      media_map.insert(end_token.clone(), test_data::web::image_urls::FOREST_BACKDROP_IMAGE_URL.to_string());

      let response = run_pipeline_with_media_map(GenerateVideoRequestBuilder {
        prompt: Some("The dog walks from the lake to the forest.".to_string()),
        start_frame: Some(ImageRef::MediaFileToken(start_token)),
        end_frame: Some(ImageRef::MediaFileToken(end_token)),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..seedance2pro_fast_builder()
      }, media_map).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn image_references() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("The dog in @2 runs through the scenery in @1 towards the building in @3.".to_string()),
        reference_images: Some(ImageListRef::Urls(vec![
          test_data::web::image_urls::FOREST_BACKDROP_IMAGE_URL.to_string(),
          test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL.to_string(),
          test_data::web::image_urls::WHITE_HOUSE_SUNSET_IMAGE_URL.to_string(),
        ])),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..seedance2pro_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  // ── Helpers ──

  fn seedance2pro_fast_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0Fast,
      provider: Provider::Seedance2Pro,
      duration_seconds: Some(4),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn get_seedance2pro_client() -> RouterClient {
    let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/seedance2pro_cookies.txt")
      .expect("Failed to read seedance2pro cookies");
    let session = Seedance2ProSession::from_cookies_string(cookies.trim().to_string());
    RouterClient::Seedance2Pro(RouterSeedance2ProClient::new(session))
  }

  /// Run the full pipeline: builder -> build2 -> finalize -> send.
  async fn run_pipeline(builder: GenerateVideoRequestBuilder) -> GenerateVideoResponse {
    let client = get_seedance2pro_client();

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let draft = match draft_or_request {
      VideoGenerationDraftOrRequest::Draft(d) => d,
      _ => panic!("expected Draft variant"),
    };

    let draft_context = VideoGenerationDraftContext {
      client: Some(&client),
      ..Default::default()
    };

    let request = draft.finalize(draft_context).await.expect("finalize should succeed");
    let response = request.send_request(&client).await.expect("send_request should succeed");

    match &response {
      GenerateVideoResponse::Seedance2Pro(p) => {
        println!("task_id={}, order_id={}", p.task_id, p.order_id);
      }
      other => println!("response: {:?}", other),
    }

    response
  }

  /// Run the full pipeline with a media file token map for resolving references.
  async fn run_pipeline_with_media_map(
    builder: GenerateVideoRequestBuilder,
    media_map: HashMap<MediaFileToken, String>,
  ) -> GenerateVideoResponse {
    let client = get_seedance2pro_client();

    let draft_or_request = builder.build2().expect("build2 should succeed");
    let draft = match draft_or_request {
      VideoGenerationDraftOrRequest::Draft(d) => d,
      _ => panic!("expected Draft variant"),
    };

    let draft_context = VideoGenerationDraftContext {
      client: Some(&client),
      media_file_to_artcraft_url_map: Some(&media_map),
      ..Default::default()
    };

    let request = draft.finalize(draft_context).await.expect("finalize should succeed");
    let response = request.send_request(&client).await.expect("send_request should succeed");

    match &response {
      GenerateVideoResponse::Seedance2Pro(p) => {
        println!("task_id={}, order_id={}", p.task_id, p.order_id);
      }
      other => println!("response: {:?}", other),
    }

    response
  }
}
