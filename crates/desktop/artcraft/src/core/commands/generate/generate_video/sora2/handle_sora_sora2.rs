use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::generate::generate_video::request::{TauriGenerateVideoRequest, SoraOrientation};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::sora::utils::upload_images_to_sora::{upload_images_to_sora, UploadImagesToSoraArgs, UploadImagesToSoraResult};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};
use openai_sora_client::recipes::generate_sora2_video::generate_sora2_video_with_session_auto_renew::generate_sora2_video_with_session_auto_renew;
use openai_sora_client::recipes::list_sora2_drafts::list_sora2_drafts_with_session_auto_renew::list_sora2_drafts_with_session_auto_renew;
use openai_sora_client::requests::generate_sora2_video::generate_sora2_video::{GenerateSora2VideoArgs, Orientation};
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;

pub async fn handle_sora_sora2(
  request: &TauriGenerateVideoRequest,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  sora_creds_manager: &SoraCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let mut sora_creds = match sora_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Sora, &app);
      return Err(GenerateError::needs_sora_credentials());
    },
  };

  // TODO: Handle multiple input images.
  let image_media_tokens = match &request.image_media_token {
    Some(token) => vec![token.clone()],
    None => vec![],
  };
  
  let mut image_reference_media_ids = None;
  
  if !image_media_tokens.is_empty() {
    let result = upload_images_to_sora(UploadImagesToSoraArgs {
      storyteller_host: &app_env_configs.storyteller_host,
      image_media_tokens: &image_media_tokens,
      app_data_root,
      sora_creds_manager,
    }).await?;
    
    if let Some(creds) = result.maybe_new_sora_credentials {
      sora_creds = creds;
    }
    
    image_reference_media_ids = Some(result.sora_media_tokens);
  }

  let orientation = match request.sora_orientation {
    Some(SoraOrientation::Landscape) => Orientation::Landscape,
    Some(SoraOrientation::Portrait) => Orientation::Portrait,
    None => Orientation::Landscape,
  };
  
  info!("Calling Sora 2 generate...");

  let result = generate_sora2_video_with_session_auto_renew(
    GenerateSora2VideoArgs {
      prompt: request.prompt.as_deref().unwrap_or(""),
      credentials: &sora_creds,
      request_timeout: None,
      orientation,
      image_reference_media_ids: image_reference_media_ids.as_ref(),
    }
  ).await;

  let job_id = match result {
    Ok((response, maybe_new_session)) => {
      info!("Successfully enqueued Sora2 Video: {}", response.task_id);
      
      if let Some(new_creds) = maybe_new_session {
        if let Err(err) = sora_creds_manager.set_credentials(&new_creds) {
          error!("Failed to save renewed Sora credentials: {:?}", err);
        }
      }
      
      response.task_id
    }
    Err(err) => {
      error!("Failed to use Sora2 video: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Sora,
    model: Some(GenerationModel::Sora2),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::VideoGeneration,
  })
}
