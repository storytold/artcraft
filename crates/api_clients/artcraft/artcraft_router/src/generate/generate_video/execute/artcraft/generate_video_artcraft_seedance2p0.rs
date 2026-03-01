use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use crate::generate::generate_video::video_generation_plan::GenerateVideoResponse;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0MultiFunctionVideoGenRequest;
use artcraft_client::endpoints::generate::video::multi_function::seedance_2p0_multi_function_video_gen::seedance_2p0_multi_function_video_gen;

pub async fn execute_artcraft_seedance2p0(
  plan: &PlanArtcraftSeedance2p0<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let request = Seedance2p0MultiFunctionVideoGenRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    prompt: plan.prompt.map(|p| p.to_string()),
    start_frame_media_token: plan.start_frame.map(|t| t.to_owned()),
    end_frame_media_token: plan.end_frame.map(|t| t.to_owned()),
    reference_image_media_tokens: plan.reference_images.map(|tokens| tokens.to_owned()),
    aspect_ratio: plan.aspect_ratio,
    duration_seconds: plan.duration_seconds,
    batch_count: Some(plan.batch_count),
  };

  let response = seedance_2p0_multi_function_video_gen(
    &artcraft_client.api_host,
    Some(&artcraft_client.credentials),
    request,
  )
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

  Ok(GenerateVideoResponse {
    inference_job_token: response.inference_job_token,
    all_inference_job_tokens: response.all_inference_job_tokens,
  })
}

#[cfg(test)]
mod tests {
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::generate::generate_video::video_generation_plan::VideoGenerationPlan;
  use crate::test_helpers::{base_video_request, get_artcraft_client};

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test_text_to_video_seedance_2p0() {
    let client = get_artcraft_client();
    let request = crate::generate::generate_video::generate_video_request::GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::WideSixteenByNine),
      video_batch_count: Some(1),
      prompt: Some("a cat walking through a cyberpunk city at night"),
      ..base_video_request()
    };

    let plan = request.build().unwrap();
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
    let request = crate::generate::generate_video::generate_video_request::GenerateVideoRequest {
      aspect_ratio: Some(CommonAspectRatio::Square),
      video_batch_count: Some(2),
      prompt: Some("a dog surfing a wave, cinematic"),
      ..base_video_request()
    };

    let plan = request.build().unwrap();
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
