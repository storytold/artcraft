use seedance2pro_client::generate::video::generate_happy_horse_1p0::{
  generate_happy_horse_1p0, GenerateHappyHorse1p0Args, GenerateHappyHorse1p0Request,
};

use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{GenerateVideoResponse, Seedance2proVideoResponsePayload};

#[derive(Debug, Clone)]
pub struct KinoviHappyHorse1p0RequestState {
  pub request: GenerateHappyHorse1p0Request,
}

impl KinoviHappyHorse1p0RequestState {
  pub async fn send(&self, client: &RouterSeedance2ProClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let session = &client.session;

    let args = GenerateHappyHorse1p0Args {
      session,
      host_override: None,
      request: self.request.clone(),
    };

    let response = generate_happy_horse_1p0(args)
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

    Ok(GenerateVideoResponse::Seedance2Pro(Seedance2proVideoResponsePayload {
      order_id: response.order_id,
      task_id: response.task_id,
      maybe_order_ids: response.order_ids,
      maybe_task_ids: response.task_ids,
    }))
  }
}

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::client::router_client::RouterClient;
  use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video_v2::video_generation_draft_context::VideoGenerationDraftContext;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
  use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;

  mod aspect_ratio_tests {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn landscape() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A corgi running through a field of wildflowers at sunset.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..happy_horse_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore]
    async fn portrait() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A cat sitting on a windowsill watching rain.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..happy_horse_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore]
    async fn square() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A hummingbird hovering near a flower.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::Square),
        ..happy_horse_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
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
        ..happy_horse_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore]
    async fn res_1080p() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A fox walking through a snowy forest.".to_string()),
        resolution: Some(CommonResolution::TenEightyP),
        ..happy_horse_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
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
        ..happy_horse_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore]
    async fn keyframe_start_frame() {
      let start_token = MediaFileToken::new("mf_start".to_string());

      let mut media_map = HashMap::new();
      media_map.insert(start_token.clone(), JUNO_AT_LAKE_IMAGE_URL.to_string());

      let response = run_pipeline_with_media_map(GenerateVideoRequestBuilder {
        prompt: Some("The dog watches the sunset over the lake.".to_string()),
        start_frame: Some(ImageRef::MediaFileToken(start_token)),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..happy_horse_builder()
      }, media_map).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore]
    async fn keyframe_1080p_square() {
      let start_token = MediaFileToken::new("mf_start".to_string());

      let mut media_map = HashMap::new();
      media_map.insert(start_token.clone(), JUNO_AT_LAKE_IMAGE_URL.to_string());

      let response = run_pipeline_with_media_map(GenerateVideoRequestBuilder {
        prompt: Some("A dragon soaring over the mountains.".to_string()),
        start_frame: Some(ImageRef::MediaFileToken(start_token)),
        aspect_ratio: Some(CommonAspectRatio::Square),
        resolution: Some(CommonResolution::TenEightyP),
        duration_seconds: Some(15),
        ..happy_horse_builder()
      }, media_map).await;
      assert!(matches!(response, GenerateVideoResponse::Seedance2Pro(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  // ── Helpers ──

  fn happy_horse_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::HappyHorse1p0,
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
