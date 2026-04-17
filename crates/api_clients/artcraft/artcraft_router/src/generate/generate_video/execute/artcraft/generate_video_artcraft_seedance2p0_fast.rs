use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::video::omni_gen_video::omni_gen_video_generate;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
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
    artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0AspectRatio::Landscape16x9 => CommonAspectRatio::WideSixteenByNine,
    artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0AspectRatio::Portrait9x16 => CommonAspectRatio::TallNineBySixteen,
    artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0AspectRatio::Square1x1 => CommonAspectRatio::Square,
    artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0AspectRatio::Standard4x3 => CommonAspectRatio::WideFourByThree,
    artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0AspectRatio::Portrait3x4 => CommonAspectRatio::TallThreeByFour,
  });

  let request = OmniGenVideoCostAndGenerateRequest {
    idempotency_token: Some(plan.idempotency_token.clone()),
    model: Some(CommonVideoModel::Seedance2p0Fast),
    prompt: plan.prompt.clone(),
    negative_prompt: None,
    start_frame_image_media_token: plan.start_frame.clone(),
    end_frame_image_media_token: plan.end_frame.clone(),
    reference_image_media_tokens: plan.reference_images.clone(),
    reference_video_media_tokens: plan.reference_videos.clone(),
    reference_audio_media_tokens: plan.reference_audio.clone(),
    reference_character_tokens: None,
    resolution: None,
    aspect_ratio,
    quality: None,
    duration_seconds: plan.duration_seconds.map(|d| d as u16),
    video_batch_count: Some(match plan.batch_count {
      artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0BatchCount::One => 1,
      artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0BatchCount::Two => 2,
      artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0BatchCount::Four => 4,
    }),
    generate_audio: None,
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
