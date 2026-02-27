use artcraft_router::api::common_aspect_ratio::CommonAspectRatio;
use artcraft_router::api::common_video_model::CommonVideoModel;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_artcraft_client::RouterArtcraftClient;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::client_error::ClientError;
use artcraft_router::generate::generate_video::begin_video_generation::begin_video_generation;
use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount,
};
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use storyteller_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use storyteller_client::utils::api_host::ApiHost;

fn get_artcraft_client() -> RouterClient {
  let cookies = std::fs::read_to_string("/Users/bt/Artcraft/credentials/artcraft_cookies.txt")
    .expect("Failed to read /Users/bt/Artcraft/credentials/artcraft_cookies.txt");
  let cookies = cookies.trim().to_string();
  let credentials = StorytellerCredentialSet::parse_multi_cookie_header(&cookies)
      .expect("Failed to parse cookies")
      .expect("No credentials found");
  RouterClient::Artcraft(RouterArtcraftClient::new(ApiHost::Storyteller, credentials))
}

fn base_request() -> GenerateVideoRequest<'static> {
  GenerateVideoRequest {
    model: CommonVideoModel::Seedance2p0,
    provider: Provider::Artcraft,
    prompt: Some("a cat in space"),
    start_frame: None,
    end_frame: None,
    reference_images: None,
    resolution: None,
    aspect_ratio: None,
    duration_seconds: None,
    video_batch_count: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
    idempotency_token: None,
  }
}

mod plan_tests {
  use super::*;

  #[test]
  fn aspect_ratio_direct_16x9() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      ..base_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = begin_video_generation(&request).unwrap();
    assert!(matches!(plan.aspect_ratio, Some(Seedance2p0AspectRatio::Landscape16x9)));
  }

  #[test]
  fn aspect_ratio_direct_9x16() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::TallNineBySixteen),
      ..base_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = begin_video_generation(&request).unwrap();
    assert!(matches!(plan.aspect_ratio, Some(Seedance2p0AspectRatio::Portrait9x16)));
  }

  #[test]
  fn aspect_ratio_direct_square() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      ..base_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = begin_video_generation(&request).unwrap();
    assert!(matches!(plan.aspect_ratio, Some(Seedance2p0AspectRatio::Square1x1)));
  }

  #[test]
  fn aspect_ratio_nearest_match_both_strategies() {
    // WideThreeByTwo (AR 1.5) is nearest to Standard4x3 (1.33), not Landscape16x9 (1.78)
    for strategy in [
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateVideoRequest {
        aspect_ratio: Some(CommonAspectRatio::WideThreeByTwo),
        request_mismatch_mitigation_strategy: strategy,
        ..base_request()
      };
      let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = begin_video_generation(&request).unwrap();
      assert!(
        matches!(plan.aspect_ratio, Some(Seedance2p0AspectRatio::Standard4x3)),
        "Expected Standard4x3 for WideThreeByTwo with {:?}", strategy,
      );
    }
  }

  #[test]
  fn aspect_ratio_error_out_on_unsupported() {
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideThreeByTwo),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      ..base_request()
    };
    let result = begin_video_generation(&request);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption { .. }))
    ));
  }

  #[test]
  fn batch_count_zero_is_always_error() {
    for strategy in [
      RequestMismatchMitigationStrategy::ErrorOut,
      RequestMismatchMitigationStrategy::PayMoreUpgrade,
      RequestMismatchMitigationStrategy::PayLessDowngrade,
    ] {
      let request = GenerateVideoRequest {
        video_batch_count: Some(0),
        request_mismatch_mitigation_strategy: strategy,
        ..base_request()
      };
      let result = begin_video_generation(&request);
      assert!(
        matches!(result, Err(ArtcraftRouterError::Client(ClientError::UserRequestedZeroGenerations))),
        "Expected UserRequestedZeroGenerations with {:?}", strategy,
      );
    }
  }

  #[test]
  fn batch_count_direct_mapping() {
    let req = GenerateVideoRequest { video_batch_count: Some(1), ..base_request() };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = begin_video_generation(&req).unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::One));

    let req = GenerateVideoRequest { video_batch_count: Some(2), ..base_request() };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = begin_video_generation(&req).unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::Two));

    let req = GenerateVideoRequest { video_batch_count: Some(4), ..base_request() };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = begin_video_generation(&req).unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::Four));
  }

  #[test]
  fn batch_count_three_upgrade_rounds_to_four() {
    let request = GenerateVideoRequest {
      video_batch_count: Some(3),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
      ..base_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = begin_video_generation(&request).unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::Four));
  }

  #[test]
  fn batch_count_three_downgrade_rounds_to_two() {
    let request = GenerateVideoRequest {
      video_batch_count: Some(3),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayLessDowngrade,
      ..base_request()
    };
    let VideoGenerationPlan::ArtcraftSeedance2p0(plan) = begin_video_generation(&request).unwrap();
    assert!(matches!(plan.batch_count, Seedance2p0BatchCount::Two));
  }

  #[test]
  fn url_image_ref_returns_error() {
    let request = GenerateVideoRequest {
      start_frame: Some(ImageRef::Url("https://example.com/image.jpg")),
      ..base_request()
    };
    let result = begin_video_generation(&request);
    assert!(matches!(
      result,
      Err(ArtcraftRouterError::Client(ClientError::ArtcraftOnlySupportsMediaTokens))
    ));
  }
}

mod real_requests {
  use super::*;

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_seedance_2p0() {
    let client = get_artcraft_client();
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      video_batch_count: Some(1),
      prompt: Some("a cat walking through a cyberpunk city at night"),
      ..base_request()
    };

    let plan = begin_video_generation(&request).unwrap();
    let result = plan.generate_video(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_video request failed");
    println!("Job token: {:?}", response.inference_job_token);
    println!("All job tokens: {:?}", response.all_inference_job_tokens);

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_seedance_2p0_batch_two() {
    let client = get_artcraft_client();
    let request = GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      video_batch_count: Some(2),
      prompt: Some("a dog surfing a wave, cinematic"),
      ..base_request()
    };

    let plan = begin_video_generation(&request).unwrap();
    let result = plan.generate_video(&client).await;

    println!("Result: {:?}", result);
    let response = result.expect("generate_video request failed");
    println!("Job tokens ({} total):", response.all_inference_job_tokens.len());
    for token in &response.all_inference_job_tokens {
      println!("  {:?}", token);
    }

    assert_eq!(1, 2); // NB: Intentional failure to inspect the response above.
  }
}
