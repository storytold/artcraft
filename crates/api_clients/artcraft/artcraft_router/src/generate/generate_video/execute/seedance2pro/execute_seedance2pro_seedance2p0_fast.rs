use crate::client::router_seedance2pro_client::RouterSeedance2ProClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_video::execute::seedance2pro::execute_seedance2pro_seedance2p0::{
  upload_optional_url, upload_optional_url_list,
};
use crate::generate::generate_video::generate_video_response::{
  GenerateVideoResponse, Seedance2proVideoResponsePayload,
};
use crate::generate::generate_video::plan::seedance2pro::plan_generate_video_seedance2pro_seedance2p0_fast::PlanSeedance2proSeedance2p0Fast;
use seedance2pro_client::requests::generate_video::generate_video::{
  generate_video, GenerateVideoArgs, GenerateVideoRequest, KinoviModelType,
};

/// Execute Seedance 2.0 Fast via the Seedance2Pro/Kinovi provider.
///
/// Identical to the Seedance 2.0 Pro executor except it uses
/// `ModelType::Seedance2Fast` instead of `ModelType::Seedance2Pro`.
pub async fn execute_seedance2pro_seedance2p0_fast(
  plan: &PlanSeedance2proSeedance2p0Fast,
  seedance2pro_client: &RouterSeedance2ProClient,
) -> Result<GenerateVideoResponse, ArtcraftRouterError> {
  let session = &seedance2pro_client.session;

  // Upload media files to seedance2pro CDN
  let start_frame_url = upload_optional_url(session, plan.start_frame_url.as_deref()).await?;
  let end_frame_url = upload_optional_url(session, plan.end_frame_url.as_deref()).await?;
  let reference_image_urls = upload_optional_url_list(session, plan.reference_image_urls.as_deref()).await?;
  let reference_video_urls = upload_optional_url_list(session, plan.reference_video_urls.as_deref()).await?;
  let reference_audio_urls = upload_optional_url_list(session, plan.reference_audio_urls.as_deref()).await?;

  let args = GenerateVideoArgs {
    session,
    host_override: None,
    request: GenerateVideoRequest {
      model_type: KinoviModelType::Seedance2Fast, // <-- Fast, not Pro
      prompt: plan.prompt.clone().unwrap_or_default(),
      resolution: plan.resolution,
      output_resolution: plan.output_resolution,
      duration_seconds: plan.duration_seconds,
      batch_count: plan.batch_count,
      start_frame_url,
      end_frame_url,
      reference_image_urls,
      reference_video_urls,
      reference_audio_urls,
      character_ids: None,
      use_face_blur_hack: None,
    },
  };

  let response = generate_video(args)
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::Seedance2Pro(err)))?;

  Ok(GenerateVideoResponse::Seedance2Pro(Seedance2proVideoResponsePayload {
    order_id: response.order_id,
    task_id: response.task_id,
  }))
}
