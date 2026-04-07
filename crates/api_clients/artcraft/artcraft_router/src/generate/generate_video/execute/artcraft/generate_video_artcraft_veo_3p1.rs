use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_3p1::PlanArtcraftVeo3p1;
use artcraft_api_defs::generate::video::multi_function::veo_3p1_multi_function_video_gen::Veo3p1MultiFunctionVideoGenRequest;
use artcraft_client::endpoints::generate::video::multi_function::veo_3p1_multi_function_video_gen::veo_3p1_multi_function_video_gen;

pub async fn execute_artcraft_veo_3p1(
  plan: &PlanArtcraftVeo3p1<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let request = Veo3p1MultiFunctionVideoGenRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    prompt: plan.prompt.map(|p| p.to_string()),
    negative_prompt: plan.negative_prompt.map(|p| p.to_string()),
    start_frame_image_media_token: plan.start_frame.map(|t| t.to_owned()),
    end_frame_image_media_token: plan.end_frame.map(|t| t.to_owned()),
    duration: plan.duration,
    aspect_ratio: plan.aspect_ratio,
    resolution: plan.resolution,
    generate_audio: plan.generate_audio,
    enhance_prompt: None,
    seed: None,
    auto_fix: None,
  };

  let response = veo_3p1_multi_function_video_gen(
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
