use crate::client::router_artcraft_client::RouterArtcraftClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::generate_video_response::{
  ArtcraftVideoResponsePayload, GenerateVideoResponse,
};
use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_veo_2::PlanArtcraftVeo2;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::GenerateVeo2ImageToVideoRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_client::endpoints::generate::video::generate_veo_2_image_to_video::generate_veo_2_image_to_video;
use artcraft_client::endpoints::omni_gen::generate::video::omni_gen_video::omni_gen_video_generate;
use enums::common::generation::common_video_model::CommonVideoModel;

pub async fn execute_artcraft_veo_2(
  plan: &PlanArtcraftVeo2<'_>,
  artcraft_client: &RouterArtcraftClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let inference_job_token = match plan.start_frame {
    Some(media_file_token) => {
      // Image-to-video: use the legacy dedicated endpoint.
      let request = GenerateVeo2ImageToVideoRequest {
        uuid_idempotency_token: plan.idempotency_token.clone(),
        media_file_token: Some(media_file_token.to_owned()),
        prompt: plan.prompt.map(|p| p.to_string()),
        aspect_ratio: plan.aspect_ratio.clone(),
        duration: plan.duration.clone(),
      };

      let response = generate_veo_2_image_to_video(
        &artcraft_client.api_host,
        Some(&artcraft_client.credentials),
        request,
      )
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

      response.inference_job_token
    }
    None => {
      // Text-to-video: use the omni-gen unified endpoint.
      let request = OmniGenVideoCostAndGenerateRequest {
        idempotency_token: Some(plan.idempotency_token.clone()),
        model: Some(CommonVideoModel::Veo2),
        prompt: plan.prompt.map(|p| p.to_string()),
        negative_prompt: None,
        start_frame_image_media_token: None,
        end_frame_image_media_token: None,
        reference_image_media_tokens: None,
        reference_video_media_tokens: None,
        reference_audio_media_tokens: None,
        reference_character_tokens: None,
        resolution: None,
        aspect_ratio: None,
        quality: None,
        duration_seconds: None,
        video_batch_count: None,
        generate_audio: None,
      };

      let response = omni_gen_video_generate(
        &artcraft_client.api_host,
        Some(&artcraft_client.credentials),
        request,
      )
      .await
      .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Storyteller(err)))?;

      response.inference_job_token
    }
  };

  let all_tokens = vec![inference_job_token.clone()];
  Ok(GenerateVideoResponse::Artcraft(ArtcraftVideoResponsePayload {
    inference_job_token,
    all_inference_job_tokens: all_tokens,
  }))
}
