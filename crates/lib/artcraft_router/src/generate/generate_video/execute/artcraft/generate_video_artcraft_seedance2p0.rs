use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use crate::generate::generate_video::video_generation_plan::GenerateVideoResponse;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0MultiFunctionVideoGenRequest;
use storyteller_client::endpoints::generate::video::multi_function::seedance_2p0_multi_function_video_gen::seedance_2p0_multi_function_video_gen;

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
