use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_to_video::enqueue_image_to_video_command::EnqueueImageToVideoRequest;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use artcraft_router::api::common_video_model::CommonVideoModel;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_artcraft_client::RouterArtcraftClient;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::generate::generate_video::begin_video_generation::begin_video_generation;
use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};
use storyteller_client::credentials::storyteller_credential_set::StorytellerCredentialSet;

pub(super) async fn handle_artcraft_seedance_2p0(
  request: &EnqueueImageToVideoRequest,
  app_env_configs: &AppEnvConfigs,
  creds: &StorytellerCredentialSet,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let client = RouterClient::Artcraft(RouterArtcraftClient::new(
    app_env_configs.storyteller_host.clone(),
    creds.clone(),
  ));

  let start_frame = request.image_media_token.as_ref().map(ImageRef::MediaFileToken);
  let end_frame = request.end_frame_image_media_token.as_ref().map(ImageRef::MediaFileToken);
  let reference_images = request.reference_image_media_tokens.as_ref().map(ImageListRef::MediaFileTokens);

  let router_request = GenerateVideoRequest {
    model: CommonVideoModel::Seedance2p0,
    provider: Provider::Artcraft,
    prompt: request.prompt.as_deref(),
    start_frame,
    end_frame,
    reference_images,
    resolution: None,
    aspect_ratio: request.aspect_ratio,
    duration_seconds: request.duration_seconds,
    video_batch_count: request.video_batch_count,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    idempotency_token: None,
  };

  let plan = begin_video_generation(&router_request)?;
  
  info!("Video Generation Plan: {:?}", plan);

  let response = match plan.generate_video(&client).await {
    Ok(resp) => {
      info!("Successfully enqueued.");
      resp
    }
    Err(err) => {
      error!("Failed to enqueue: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::VideoGeneration,
    model: Some(GenerationModel::Seedance2p0),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(response.inference_job_token.to_string()),
  })
}
