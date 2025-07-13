use crate::core::commands::enqueue::object::enqueue_image_to_3d_object_command::{EnqueueImageTo3dObjectModel, EnqueueImageTo3dObjectRequest};
use crate::core::commands::enqueue::object::internal_object_error::InternalObjectError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::object::generate_hunyuan_2_0_image_to_3d::GenerateHunyuan20ImageTo3dRequest;
use artcraft_api_defs::generate::object::generate_hunyuan_2_1_image_to_3d::GenerateHunyuan21ImageTo3dRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::generate::object::generate_hunyuan_3d_2_0_image_to_3d::generate_hunyuan3d_2_0_image_to_3d;
use storyteller_client::generate::object::generate_hunyuan_3d_2_1_image_to_3d::generate_hunyuan3d_2_1_image_to_3d;
use tauri::AppHandle;

pub async fn handle_object_artcraft(
  request: EnqueueImageTo3dObjectRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, InternalObjectError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      error!("No Artcraft credentials are set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_artcraft_credentials(GenerationAction::ImageTo3d);

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      return Err(InternalObjectError::NeedsStorytellerCredentials);
    },
  };
  
  info!("Calling Artcraft image to 3d ...");

  let uuid_idempotency_token = generate_random_uuid();
  
  let mut used_model = None;
  
  let job_token = match request.model {
    None => {
      return Err(InternalObjectError::NoModelSpecified);
    }
    Some(
      EnqueueImageTo3dObjectModel::Hunyuan3d2 |
      EnqueueImageTo3dObjectModel::Hunyuan3d2_0
    ) => {
      info!("enqueue Artcraft Hunyuan 3D 2.0");
      used_model = Some(GenerationModel::Hunyuan3d2_0);
      let request = GenerateHunyuan20ImageTo3dRequest { 
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
      };
      let result = generate_hunyuan3d_2_0_image_to_3d(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Hunyuan 3D 2.0");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Hunyuan 3D 2.0: {:?}", err);
          return Err(InternalObjectError::StorytellerError(err));
        }
      }
    }
    Some(EnqueueImageTo3dObjectModel::Hunyuan3d2_1) => {
      info!("enqueue Artcraft Hunyuan 3D 2.1");
      used_model = Some(GenerationModel::Hunyuan3d2_1);
      let request = GenerateHunyuan21ImageTo3dRequest {
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
      };
      let result = generate_hunyuan3d_2_1_image_to_3d(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Hunyuan 3D 2.1");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Hunyuan 3D 2.1: {:?}", err);
          return Err(InternalObjectError::StorytellerError(err));
        }
      }
    }
  };

  info!("Successfully enqueued 3D generation");
  
  //let event = GenerationEnqueueSuccessEvent {
  //  action: GenerationAction::ImageTo3d,
  //  service: GenerationServiceProvider::Artcraft,
  //  model: None,
  //};
  //
  //if let Err(err) = event.send(app) {
  //  error!("Failed to emit event: {:?}", err); // Fail open.
  //}

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ObjectGeneration,
    model: used_model,
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_token.to_string()),
  })
}
