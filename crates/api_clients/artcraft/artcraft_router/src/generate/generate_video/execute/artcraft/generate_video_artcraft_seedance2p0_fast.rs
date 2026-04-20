use crate::api::common_resolution::CommonResolution as CommonResolutionRouter;
use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{Seedance2p0AspectRatio, Seedance2p0BatchCount};
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::video::omni_gen_video::omni_gen_video_generate;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

/// Execute Seedance 2.0 Fast via the Artcraft omni-gen video endpoint.
///
/// Unlike Seedance 2.0 Pro (which uses the legacy dedicated endpoint),
/// Seedance 2.0 Fast routes through the omni-gen unified video endpoint.
pub async fn execute_artcraft_seedance2p0_fast(
  plan: &PlanArtcraftSeedance2p0,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let aspect_ratio = plan.aspect_ratio.map(|ar| match ar {
    Seedance2p0AspectRatio::Landscape16x9 => CommonAspectRatio::WideSixteenByNine,
    Seedance2p0AspectRatio::Portrait9x16 => CommonAspectRatio::TallNineBySixteen,
    Seedance2p0AspectRatio::Square1x1 => CommonAspectRatio::Square,
    Seedance2p0AspectRatio::Standard4x3 => CommonAspectRatio::WideFourByThree,
    Seedance2p0AspectRatio::Portrait3x4 => CommonAspectRatio::TallThreeByFour,
  });

  let resolution = plan.resolution.map(|r| match r {
    CommonResolutionRouter::FourEightyP => CommonResolution::FourEightyP,
    CommonResolutionRouter::SevenTwentyP => CommonResolution::SevenTwentyP,
    CommonResolutionRouter::TenEightyP => CommonResolution::TenEightyP,
    CommonResolutionRouter::HalfK => CommonResolution::HalfK,
    CommonResolutionRouter::OneK => CommonResolution::OneK,
    CommonResolutionRouter::TwoK => CommonResolution::TwoK,
    CommonResolutionRouter::ThreeK => CommonResolution::ThreeK,
    CommonResolutionRouter::FourK => CommonResolution::FourK,
  });

  let request = OmniGenVideoCostAndGenerateRequest {
    idempotency_token: Some(plan.idempotency_token.clone()),
    model: Some(CommonVideoModel::Seedance2p0Fast),
    prompt: plan.prompt.clone(),
    start_frame_image_media_token: plan.start_frame.clone(),
    end_frame_image_media_token: plan.end_frame.clone(),
    reference_image_media_tokens: plan.reference_images.clone(),
    reference_video_media_tokens: plan.reference_videos.clone(),
    reference_audio_media_tokens: plan.reference_audio.clone(),
    reference_character_tokens: plan.reference_characters.clone(),
    resolution,
    aspect_ratio,
    duration_seconds: plan.duration_seconds.map(|d| d as u16),
    video_batch_count: Some(match plan.batch_count {
      Seedance2p0BatchCount::One => 1,
      Seedance2p0BatchCount::Two => 2,
      Seedance2p0BatchCount::Four => 4,
    }),
    quality: None,
    generate_audio: None,
    negative_prompt: None,
  };

  let response = omni_gen_video_generate(
    &artcraft_client.api_host,
    Some(&artcraft_client.credentials),
    request,
  )
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

  let all_tokens = vec![response.inference_job_token.clone()];
  Ok(GenerateVideoResponse::Artcraft(ArtcraftVideoResponsePayload {
    inference_job_token: response.inference_job_token,
    all_inference_job_tokens: all_tokens,
  }))
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_ref::ImageRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
  use crate::test_helpers::{base_video_request, get_artcraft_client};
  use tokens::tokens::media_files::MediaFileToken;

  fn fast_request() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0Fast,
      prompt: Some("a corgi walking through a cyberpunk city at night".to_string()),
      ..base_video_request()
    }
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_fast_720p_wide() {
    let client = get_artcraft_client();
    let request = GenerateVideoRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      resolution: Some(CommonResolution::SevenTwentyP),
      video_batch_count: Some(1),
      ..fast_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_video(&client).await;
    println!("Result: {:?}", result);
    let response = result.expect("generate_video request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job token: {:?}", payload.inference_job_token);
    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_fast_480p_square() {
    let client = get_artcraft_client();
    let request = GenerateVideoRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::Square),
      resolution: Some(CommonResolution::FourEightyP),
      video_batch_count: Some(1),
      ..fast_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_video(&client).await;
    println!("Result: {:?}", result);
    let response = result.expect("generate_video request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job token: {:?}", payload.inference_job_token);
    assert_eq!(1, 2);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_image_to_video_fast_with_start_keyframe() {
    let client = get_artcraft_client();
    let request = GenerateVideoRequestBuilder {
      start_frame: Some(ImageRef::MediaFileToken(
        MediaFileToken::new("mf_test_keyframe_placeholder".to_string()),
      )),
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      resolution: Some(CommonResolution::SevenTwentyP),
      video_batch_count: Some(1),
      ..fast_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_video(&client).await;
    println!("Result: {:?}", result);
    let response = result.expect("generate_video request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job token: {:?}", payload.inference_job_token);
    assert_eq!(1, 2);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_fast_batch_2() {
    let client = get_artcraft_client();
    let request = GenerateVideoRequestBuilder {
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      resolution: Some(CommonResolution::SevenTwentyP),
      video_batch_count: Some(2),
      ..fast_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_video(&client).await;
    println!("Result: {:?}", result);
    let response = result.expect("generate_video request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job tokens ({} total):", payload.all_inference_job_tokens.len());
    for token in &payload.all_inference_job_tokens {
      println!("  {:?}", token);
    }
    assert_eq!(1, 2);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_fast_with_reference_images() {
    let client = get_artcraft_client();
    let request = GenerateVideoRequestBuilder {
      reference_images: Some(crate::api::image_list_ref::ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_test_ref_image_placeholder".to_string()),
      ])),
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      resolution: Some(CommonResolution::SevenTwentyP),
      video_batch_count: Some(1),
      ..fast_request()
    };

    let plan = request.build().unwrap();
    let result = plan.generate_video(&client).await;
    println!("Result: {:?}", result);
    let response = result.expect("generate_video request failed");
    let payload = response.get_artcraft_payload().expect("expected Artcraft payload");
    println!("Job token: {:?}", payload.inference_job_token);
    assert_eq!(1, 2);
  }

  #[test]
  fn plan_includes_resolution() {
    let request = GenerateVideoRequestBuilder {
      resolution: Some(CommonResolution::FourEightyP),
      ..fast_request()
    };
    let plan = request.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(matches!(p.resolution, Some(CommonResolution::FourEightyP)));
  }

  #[test]
  fn plan_includes_characters() {
    use crate::api::character_list_ref::CharacterListRef;
    use tokens::tokens::characters::CharacterToken;

    let request = GenerateVideoRequestBuilder {
      reference_character_tokens: Some(CharacterListRef::CharacterTokens(vec![
        CharacterToken::new("char_test123".to_string()),
      ])),
      ..fast_request()
    };
    let plan = request.build().unwrap();
    let VideoGenerationPlan::ArtcraftSeedance2p0Fast(p) = plan else { panic!("wrong variant") };
    assert!(p.reference_characters.is_some());
    assert_eq!(p.reference_characters.unwrap().len(), 1);
  }
}
