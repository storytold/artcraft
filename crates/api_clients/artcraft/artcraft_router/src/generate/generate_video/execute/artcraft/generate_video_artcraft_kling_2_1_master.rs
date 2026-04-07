use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling_2_1_master::PlanArtcraftKling21Master;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::GenerateKling21MasterImageToVideoRequest;
use artcraft_client::endpoints::generate::video::generate_kling_21_master_image_to_video::generate_kling_21_master_image_to_video;

pub async fn execute_artcraft_kling_2_1_master(
  plan: &PlanArtcraftKling21Master<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let request = GenerateKling21MasterImageToVideoRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    media_file_token: Some(plan.start_frame.to_owned()),
    prompt: plan.prompt.map(|p| p.to_string()),
    aspect_ratio: plan.aspect_ratio,
    duration: plan.duration,
  };

  let response = generate_kling_21_master_image_to_video(
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
