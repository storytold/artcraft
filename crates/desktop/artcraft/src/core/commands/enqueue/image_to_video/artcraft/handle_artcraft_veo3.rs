use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_to_video::artcraft::get_storyteller_creds_or_error::get_storyteller_creds_or_error;
use crate::core::commands::enqueue::image_to_video::enqueue_image_to_video_command::{EnqueueImageToVideoRequest, SoraOrientation};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::sora::utils::upload_images_to_sora::{upload_images_to_sora, UploadImagesToSoraArgs, UploadImagesToSoraResult};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::{GenerateKling16ProAspectRatio, GenerateKling16ProImageToVideoRequest};
use artcraft_api_defs::generate::video::generate_veo_3_image_to_video::{GenerateVeo3AspectRatio, GenerateVeo3ImageToVideoRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info};
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::generate::video::generate_veo_3_image_to_video::generate_veo_3_image_to_video;
use artcraft_client::endpoints::generate::video::multi_function::veo_3p1_multi_function_video_gen::veo_3p1_multi_function_video_gen;
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;

pub (super) async fn handle_artcraft_veo3(
  request: &EnqueueImageToVideoRequest,
  app_env_configs: &AppEnvConfigs,
  creds: &StorytellerCredentialSet,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let uuid_idempotency_token = generate_random_uuid();

  // TODO: Fix.
  let aspect_ratio = match request.sora_orientation {
    Some(SoraOrientation::Portrait) => GenerateVeo3AspectRatio::TallNineSixteen,
    Some(SoraOrientation::Landscape) => GenerateVeo3AspectRatio::WideSixteenNine,
    None => GenerateVeo3AspectRatio::WideSixteenNine,
  };
  
  let request = GenerateVeo3ImageToVideoRequest {
    uuid_idempotency_token,
    media_file_token: request.image_media_token.clone(),
    prompt: request.prompt.clone(),
    aspect_ratio: Some(aspect_ratio),
    generate_audio: request.generate_audio,
    duration: None, // TODO: Parameterize
    resolution: None, // TODO: Parameterize
  };

  let result = generate_veo_3_image_to_video(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;
  
  let job_token = match result {
    Ok(enqueued) => {
      info!("Successfully enqueued.");
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to enqueue: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::VideoGeneration,
    model: Some(GenerationModel::Veo3),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_token.to_string()),
  })
}
