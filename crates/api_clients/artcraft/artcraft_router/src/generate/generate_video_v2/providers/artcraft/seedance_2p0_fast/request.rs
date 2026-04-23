use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount, Seedance2p0MultiFunctionVideoGenRequest,
  Seedance2p0OutputResolution,
};
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::video::omni_gen_video::omni_gen_video_generate;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};

#[derive(Clone, Debug)]
pub struct ArtcraftSeedance2p0FastRequestState {
  /// Final materialized request; ready to fire.
  pub request: Seedance2p0MultiFunctionVideoGenRequest,
}

impl ArtcraftSeedance2p0FastRequestState {
  pub async fn send(&self, client: &RouterArtcraftClient) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
    let omni_request = OmniGenVideoCostAndGenerateRequest {
      idempotency_token: Some(self.request.uuid_idempotency_token.clone()),
      model: Some(CommonVideoModelEnum::Seedance2p0Fast),
      prompt: self.request.prompt.clone(),
      negative_prompt: None,
      start_frame_image_media_token: self.request.start_frame_media_token.clone(),
      end_frame_image_media_token: self.request.end_frame_media_token.clone(),
      reference_image_media_tokens: self.request.reference_image_media_tokens.clone(),
      reference_video_media_tokens: self.request.reference_video_media_tokens.clone(),
      reference_audio_media_tokens: self.request.reference_audio_media_tokens.clone(),
      reference_character_tokens: self.request.reference_character_tokens.clone(),
      resolution: self.request.output_resolution.map(map_resolution),
      aspect_ratio: self.request.aspect_ratio.map(map_aspect_ratio),
      quality: None,
      duration_seconds: self.request.duration_seconds.map(|d| d as u16),
      video_batch_count: self.request.batch_count.map(map_batch_count),
      generate_audio: None,
    };

    let response = omni_gen_video_generate(
      &client.api_host,
      Some(&client.credentials),
      omni_request,
    )
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

    Ok(GenerateVideoResponse::Artcraft(ArtcraftVideoResponsePayload {
      inference_job_token: response.inference_job_token.clone(),
      all_inference_job_tokens: vec![response.inference_job_token],
    }))
  }
}

fn map_resolution(resolution: Seedance2p0OutputResolution) -> CommonResolutionEnum {
  match resolution {
    Seedance2p0OutputResolution::FourEightyP => CommonResolutionEnum::FourEightyP,
    Seedance2p0OutputResolution::SevenTwentyP => CommonResolutionEnum::SevenTwentyP,
    Seedance2p0OutputResolution::TenEightyP => CommonResolutionEnum::TenEightyP,
  }
}

fn map_aspect_ratio(aspect_ratio: Seedance2p0AspectRatio) -> CommonAspectRatioEnum {
  match aspect_ratio {
    Seedance2p0AspectRatio::Landscape16x9 => CommonAspectRatioEnum::WideSixteenByNine,
    Seedance2p0AspectRatio::Portrait9x16 => CommonAspectRatioEnum::TallNineBySixteen,
    Seedance2p0AspectRatio::Square1x1 => CommonAspectRatioEnum::Square,
    Seedance2p0AspectRatio::Standard4x3 => CommonAspectRatioEnum::WideFourByThree,
    Seedance2p0AspectRatio::Portrait3x4 => CommonAspectRatioEnum::TallThreeByFour,
  }
}

fn map_batch_count(batch_count: Seedance2p0BatchCount) -> u16 {
  match batch_count {
    Seedance2p0BatchCount::One => 1,
    Seedance2p0BatchCount::Two => 2,
    Seedance2p0BatchCount::Four => 4,
  }
}

#[cfg(test)]
mod tests {
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
  use crate::client::router_artcraft_client::RouterArtcraftClient;
  use crate::client::router_client::RouterClient;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::generate_video_response::GenerateVideoResponse;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use artcraft_client::utils::api_host::ApiHost;

  use test_data::web::character_tokens::{JIM, KNIGHT};
  use test_data::web::image_media_tokens::{
    FOREST_BACKDROP_PRODUCTION_MEDIA_TOKEN,
    JUNO_AT_LAKE_PRODUCTION_MEDIA_TOKEN,
    WHITE_HOUSE_SUNSET_PRODUCTION_MEDIA_TOKEN,
  };

  // -- Aspect ratio tests --

  mod aspect_ratio_tests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn landscape() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A corgi running through a field of wildflowers at sunset.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..artcraft_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn portrait() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A cat sitting on a windowsill watching rain.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
        ..artcraft_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn square() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A hummingbird hovering near a flower.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::Square),
        ..artcraft_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  // -- Resolution tests --

  mod resolution_tests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn res_480p() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A shiba inu playing in autumn leaves.".to_string()),
        resolution: Some(CommonResolution::FourEightyP),
        ..artcraft_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn res_720p() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A golden retriever catching a frisbee on the beach.".to_string()),
        resolution: Some(CommonResolution::SevenTwentyP),
        ..artcraft_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  // -- Modality tests --

  mod modality_tests {
    use super::*;

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn text_to_video() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("A whale breaching in the open ocean at dawn, cinematic.".to_string()),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..artcraft_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn keyframe_start_and_end_frame() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("The dog walks from the lake to the forest.".to_string()),
        start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new(JUNO_AT_LAKE_PRODUCTION_MEDIA_TOKEN.to_string()))),
        end_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new(FOREST_BACKDROP_PRODUCTION_MEDIA_TOKEN.to_string()))),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..artcraft_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn image_references() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("The dog in @2 runs through the scenery in @1 towards the building in @3.".to_string()),
        reference_images: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new(FOREST_BACKDROP_PRODUCTION_MEDIA_TOKEN.to_string()),
          MediaFileToken::new(JUNO_AT_LAKE_PRODUCTION_MEDIA_TOKEN.to_string()),
          MediaFileToken::new(WHITE_HOUSE_SUNSET_PRODUCTION_MEDIA_TOKEN.to_string()),
        ])),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..artcraft_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }

    #[tokio::test]
    #[ignore] // manually run — fires a real API request and incurs cost
    async fn character_references() {
      let response = run_pipeline(GenerateVideoRequestBuilder {
        prompt: Some("@Jim and @Knight are sparring in a medieval arena.".to_string()),
        reference_character_tokens: Some(CharacterListRef::CharacterTokens(vec![
          CharacterToken::new(JIM.token.to_string()),
          CharacterToken::new(KNIGHT.token.to_string()),
        ])),
        aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
        ..artcraft_fast_builder()
      }).await;
      assert!(matches!(response, GenerateVideoResponse::Artcraft(_)));
      assert_eq!(1, 2, "Inspect output above");
    }
  }

  // -- Helpers --

  fn artcraft_fast_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0Fast,
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
