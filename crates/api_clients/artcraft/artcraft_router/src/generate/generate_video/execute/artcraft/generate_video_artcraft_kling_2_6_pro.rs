use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_kling_2_6_pro::PlanArtcraftKling2p6Pro;
use artcraft_api_defs::generate::video::multi_function::kling_2_6_multi_function_video_gen::Kling2p6ProMultiFunctionVideoGenRequest;
use artcraft_client::endpoints::generate::video::multi_function::kling_2p6_pro_multi_function_video_gen::kling_2p6_pro_multi_function_video_gen;

pub async fn execute_artcraft_kling_2_6_pro(
  plan: &PlanArtcraftKling2p6Pro<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let request = Kling2p6ProMultiFunctionVideoGenRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    prompt: plan.prompt.map(|p| p.to_string()),
    negative_prompt: plan.negative_prompt.map(|p| p.to_string()),
    start_frame_image_media_token: plan.start_frame.map(|t| t.to_owned()),
    duration: plan.duration,
    generate_audio: plan.generate_audio,
    aspect_ratio: plan.aspect_ratio,
  };

  let response = kling_2p6_pro_multi_function_video_gen(
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
