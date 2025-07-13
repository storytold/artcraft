use crate::core::commands::enqueue::object::enqueue_image_to_3d_object_command::{EnqueueImageTo3dObjectModel, EnqueueImageTo3dObjectRequest};
use crate::core::commands::enqueue::object::internal_object_error::InternalObjectError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::download_media_file_to_temp_dir::download_media_file_to_temp_dir;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use anyhow::anyhow;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::enqueue_hunyuan2_image_to_3d::{enqueue_hunyuan2_image_to_3d, Hunyuan2Args};
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use log::{error, info};
use tauri::AppHandle;

pub async fn handle_object_fal(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  request: EnqueueImageTo3dObjectRequest,
  fal_creds_manager: &FalCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalObjectError> {

  let api_key = match fal_creds_manager.get_key()? {
    Some(key) => key,
    None => {
      error!("No FAL API key is set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_fal_api_key(GenerationAction::ImageTo3d);

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      return Err(InternalObjectError::NeedsFalApiKey);
    },
  };
  
  //let api_key = fal_creds_manager.get_key_required()
  //    .map_err(|err| {
  //      error!("EnqueueTextToImage FAL api key required: {:?}", err);
  //      InternalObjectError::NeedsFalApiKey
  //    })?;

  let mut temp_download;

  if let Some(media_token) = request.image_media_token {
    temp_download = download_media_file_to_temp_dir(
      app_env_configs, 
      app_data_root, 
      &media_token
    ).await?;
  } else {
    return Err(InternalObjectError::AnyhowError(anyhow!("No image media token provided")));
  }

  info!("Calling FAL image to 3d ...");

  let filename = temp_download.path().to_path_buf();
  
  let mut used_model = None;

  let result = match request.model {
    None => {
      return Err(InternalObjectError::NoModelSpecified);
    }
    Some(
      EnqueueImageTo3dObjectModel::Hunyuan3d2_0 |
      EnqueueImageTo3dObjectModel::Hunyuan3d2
    ) => {
      used_model = Some(GenerationModel::Hunyuan3d2_0);
      info!("enqueue Hunyuan 3D 2.0");
      enqueue_hunyuan2_image_to_3d(Hunyuan2Args {
        image_path: filename,
        api_key: &api_key,
      }).await
    }
    _ => {
      return Err(InternalObjectError::AnyhowError(anyhow!("Wrong model specified: {:?}", request.model)));
    }
  };

  let mut job_id = None;
  
  match result {
    Ok(enqueued) => {
      info!("Successfully enqueued text to image");
      
      job_id = Some(enqueued.request_id.to_string());

      let event = GenerationEnqueueSuccessEvent {
        action: GenerationAction::ImageTo3d,
        service: GenerationServiceProvider::Fal,
        model: None,
      };

      if let Err(err) = event.send(app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      if let Err(err) = fal_task_queue.insert(&enqueued) {
        error!("Failed to enqueue task: {:?}", err);
        return Err(InternalObjectError::AnyhowError(anyhow!("Failed to enqueue task: {:?}", err)));
      }
    }
    Err(err) => {
      error!("Failed to enqueue image to 3d: {:?}", err);

      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::ImageTo3d,
        service: GenerationServiceProvider::Fal,
        model: None,
        reason: None,
      };

      if let Err(err) = event.send(app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      return Err(InternalObjectError::FalError(err));
    }
  }

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ObjectGeneration,
    model: used_model,
    provider: GenerationProvider::Fal,
    provider_job_id: job_id,
  })
}
