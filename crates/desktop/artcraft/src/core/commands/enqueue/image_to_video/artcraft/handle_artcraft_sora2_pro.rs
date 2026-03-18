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
use artcraft_api_defs::generate::video::multi_function::sora_2_pro_multi_function_video_gen::{Sora2ProMultiFunctionVideoGenAspectRatio, Sora2ProMultiFunctionVideoGenDuration, Sora2ProMultiFunctionVideoGenRequest, Sora2ProMultiFunctionVideoGenResolution};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info};
use openai_sora_client::recipes::generate_sora2_video::generate_sora2_video_with_session_auto_renew::generate_sora2_video_with_session_auto_renew;
use openai_sora_client::recipes::list_sora2_drafts::list_sora2_drafts_with_session_auto_renew::list_sora2_drafts_with_session_auto_renew;
use artcraft_client::endpoints::generate::video::generate_kling_16_pro_image_to_video::generate_kling_16_pro_image_to_video;
use artcraft_client::endpoints::generate::video::multi_function::sora_2_multi_function_video_gen::sora_2_multi_function_video_gen;
use artcraft_client::endpoints::generate::video::multi_function::sora_2_pro_multi_function_video_gen::sora_2_pro_multi_function_video_gen;
use tauri::AppHandle;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use tokens::tokens::media_files::MediaFileToken;

pub (super) async fn handle_artcraft_sora2_pro(
  request: &EnqueueImageToVideoRequest,
  app_env_configs: &AppEnvConfigs,
  creds: &StorytellerCredentialSet,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let uuid_idempotency_token = generate_random_uuid();

  let aspect_ratio = match request.sora_orientation {
    Some(SoraOrientation::Portrait) => Sora2ProMultiFunctionVideoGenAspectRatio::NineBySixteen,
    Some(SoraOrientation::Landscape) => Sora2ProMultiFunctionVideoGenAspectRatio::SixteenByNine,
    None => Sora2ProMultiFunctionVideoGenAspectRatio::SixteenByNine,
  };
  
  let request = Sora2ProMultiFunctionVideoGenRequest {
    uuid_idempotency_token,
    prompt: request.prompt.clone(),
    image_media_token: request.image_media_token.clone(),
    aspect_ratio: Some(aspect_ratio),
    resolution: Some(Sora2ProMultiFunctionVideoGenResolution::TenEightyP), // TODO: Parameterize
    duration: Some(Sora2ProMultiFunctionVideoGenDuration::TwelveSeconds), // TODO: Parameterize
  };
  
  let result = sora_2_pro_multi_function_video_gen(
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
    model: Some(GenerationModel::Sora2Pro),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_token.to_string()),
  })
}
