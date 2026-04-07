use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_3_fast::PlanArtcraftVeo3Fast;
use artcraft_api_defs::generate::video::generate_veo_3_fast_image_to_video::GenerateVeo3FastImageToVideoRequest;
use artcraft_client::endpoints::generate::video::generate_veo_3_fast_image_to_video::generate_veo_3_fast_image_to_video;

pub async fn execute_artcraft_veo_3_fast(
  plan: &PlanArtcraftVeo3Fast<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let request = GenerateVeo3FastImageToVideoRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    media_file_token: Some(plan.start_frame.to_owned()),
    prompt: plan.prompt.map(|p| p.to_string()),
    resolution: plan.resolution,
    duration: plan.duration,
    generate_audio: plan.generate_audio,
  };

  let response = generate_veo_3_fast_image_to_video(
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
