use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError};
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{EditImageQuality, EditImageSize, EnqueueEditImageCommand};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::generate::image::edit::flux_pro_kontext_max_edit_image::{FluxProKontextMaxEditImageNumImages, FluxProKontextMaxEditImageRequest};
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::{GptImage1EditImageImageQuality, GptImage1EditImageImageSize, GptImage1EditImageNumImages, GptImage1EditImageRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info};
use artcraft_client::endpoints::generate::image::edit::flux_pro_kontext_max_edit_image::flux_pro_kontext_max_edit_image;
use artcraft_client::endpoints::generate::image::edit::gpt_image_1_edit_image::gpt_image_1_edit_image;
use tauri::AppHandle;

pub async fn handle_artcraft_flux_kontext_edit(
  request: &EnqueueEditImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      return Err(GenerateError::needs_storyteller_credentials());
    },
  };

  info!("Calling Artcraft flux kontext max edit (edit) ...");

  let uuid_idempotency_token = generate_random_uuid();
  
  let num_images = match request.image_count {
    None => None,
    Some(1) => Some(FluxProKontextMaxEditImageNumImages::One),
    Some(2) => Some(FluxProKontextMaxEditImageNumImages::Two),
    Some(3) => Some(FluxProKontextMaxEditImageNumImages::Three),
    Some(4) => Some(FluxProKontextMaxEditImageNumImages::Four),
    Some(other) => {
      return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfRequestedImages {
        min: 1,
        max: 4,
        requested: other,
      }));
    },
  };
  
  let mut maybe_media_token = None;

  let list_count = request.image_media_tokens
      .as_ref()
      .map(|tokens| tokens.len())
      .unwrap_or(0);

  if request.scene_image_media_token.is_some() && list_count > 0 {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments(
      "Cannot specify both scene_image_media_token and image_media_tokens for Flux Kontext Max".to_string())));
  }

  if list_count > 1 {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments(
      "Cannot specify more than one image in image_media_tokens for Flux Kontext Max".to_string())));
  }

  if let Some(media_token) = &request.scene_image_media_token {
    maybe_media_token = Some(media_token.clone());
  }

  let maybe_list_media_token = request.image_media_tokens
      .as_ref()
      .map(|tokens| tokens.first())
      .flatten();

  if let Some(media_token) = maybe_list_media_token {
    maybe_media_token = Some(media_token.clone());
  }

  let media_token = match maybe_media_token {
    Some(token) => token,
    None => {
      return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments(
        "No input image specified for Flux Kontext Max edit".to_string())));
    },
  };

  let request = FluxProKontextMaxEditImageRequest {
    uuid_idempotency_token,
    prompt: Some(request.prompt.clone()),
    image_media_token: media_token,
    num_images,
  };

  let result = flux_pro_kontext_max_edit_image(
    &app_env_configs.storyteller_host,
    Some(&creds),
    request,
  ).await;
  
  let job_id = match result {
    Ok(enqueued) => {
      // TODO(bt,2025-07-05): Enqueue job token?
      info!("Successfully enqueued Artcraft gpt-image-1. Job token: {}", 
        enqueued.inference_job_token);
      enqueued.inference_job_token
    }
    Err(err) => {
      error!("Failed to use Artcraft gpt-image-1: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };
  
  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    model: Some(GenerationModel::FluxProKontextMax),
    provider_job_id: Some(job_id.to_string()),
    task_type: TaskType::ImageGeneration,
  })
}
