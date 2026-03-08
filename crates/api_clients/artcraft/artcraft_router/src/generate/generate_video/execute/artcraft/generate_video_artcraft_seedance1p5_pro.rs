use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance1p5_pro::PlanArtcraftSeedance1p5Pro;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};
use artcraft_api_defs::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::Seedance1p5ProMultiFunctionVideoGenRequest;
use artcraft_client::endpoints::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::seedance_1p5_pro_multi_function_video_gen;

pub async fn execute_artcraft_seedance1p5_pro(
  plan: &PlanArtcraftSeedance1p5Pro<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let request = Seedance1p5ProMultiFunctionVideoGenRequest {
    uuid_idempotency_token: plan.idempotency_token.clone(),
    prompt: plan.prompt.map(|p| p.to_string()),
    start_frame_image_media_token: plan.start_frame.map(|t| t.to_owned()),
    end_frame_image_media_token: plan.end_frame.map(|t| t.to_owned()),
    aspect_ratio: plan.aspect_ratio,
    duration: plan.duration,
    resolution: plan.resolution,
  };

  let response = seedance_1p5_pro_multi_function_video_gen(
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
