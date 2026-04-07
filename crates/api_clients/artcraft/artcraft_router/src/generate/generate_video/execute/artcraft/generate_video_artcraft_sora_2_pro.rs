use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_sora_2_pro::PlanArtcraftSora2Pro;
use artcraft_api_defs::generate::video::multi_function::sora_2_pro_multi_function_video_gen::Sora2ProMultiFunctionVideoGenRequest;
use artcraft_client::endpoints::generate::video::multi_function::sora_2_pro_multi_function_video_gen::sora_2_pro_multi_function_video_gen;

pub async fn execute_artcraft_sora_2_pro(
  plan: &PlanArtcraftSora2Pro<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let request = Sora2ProMultiFunctionVideoGenRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    prompt: plan.prompt.map(|p| p.to_string()),
    image_media_token: plan.start_frame.map(|t| t.to_owned()),
    resolution: plan.resolution,
    duration: plan.duration,
    aspect_ratio: plan.aspect_ratio,
  };

  let response = sora_2_pro_multi_function_video_gen(
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
