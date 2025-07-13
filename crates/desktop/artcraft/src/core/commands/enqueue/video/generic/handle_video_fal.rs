use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::video::enqueue_image_to_video_command::EnqueueImageToVideoRequest;
use crate::core::commands::enqueue::video::internal_video_error::InternalVideoError;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::model::video_models::VideoModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::download_media_file_to_temp_dir::download_media_file_to_temp_dir;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use anyhow::anyhow;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use fal_client::requests::queue::video_gen::enqueue_kling_16_pro_image_to_video::{enqueue_kling_16_pro_image_to_video, Kling16ProArgs, Kling16ProAspectRatio, Kling16ProDuration};
use log::{error, info};
use tauri::AppHandle;

pub async fn handle_video_fal(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  request: EnqueueImageToVideoRequest,
  fal_creds_manager: &FalCredentialManager,
  fal_task_queue: &FalTaskQueue,
) -> Result<TaskEnqueueSuccess, InternalVideoError> {

  let api_key = match fal_creds_manager.get_key()? {
    Some(key) => key,
    None => {
      error!("No FAL API key is set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_fal_api_key(GenerationAction::GenerateVideo);

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      return Err(InternalVideoError::NeedsFalApiKey);
    },
  };
  
  //let api_key = fal_creds_manager.get_key_required()
  //    .map_err(|err| {
  //      error!("EnqueueTextToImage FAL api key required: {:?}", err);
  //      InternalVideoError::NeedsFalApiKey
  //    })?;

  let mut temp_download;

  if let Some(media_token) = request.image_media_token {
    temp_download = download_media_file_to_temp_dir(
      app_env_configs,
      app_data_root, 
      &media_token
    ).await?;
  } else {
    return Err(InternalVideoError::AnyhowError(anyhow!("No image media token provided")));
  }

  let filename = temp_download.path().to_path_buf();
  
  let mut selected_model = None;

  let result = match request.model {
    None => {
      return Err(InternalVideoError::NoModelSpecified);
    }
    Some(VideoModel::Kling16Pro) => {
      info!("enqueue Kling 1.6 image to video with Kling API");
      selected_model = Some(GenerationModel::Kling1_6);
      enqueue_kling_16_pro_image_to_video(Kling16ProArgs {
        image_path: filename,
        api_key: &api_key,
        duration: Kling16ProDuration::Default,
        aspect_ratio: Kling16ProAspectRatio::WideSixteenNine,
        prompt: "",
      }).await
    }
    _ => {
      return Err(InternalVideoError::AnyhowError(anyhow!("Unsupported model: {:?}", request.model)));
    }
  };
  
  let mut job_id = None;

  match result {
    Ok(enqueued) => {
      info!("Successfully enqueued Kling 1.6 image to video");

      job_id = Some(enqueued.request_id.to_string());
      
      if let Err(err) = fal_task_queue.insert(&enqueued) {
        error!("Failed to enqueue task: {:?}", err);
        return Err(InternalVideoError::AnyhowError(anyhow!("Failed to enqueue task: {:?}", err)));
      }
    }
    Err(err) => {
      error!("Failed to enqueue image to video: {:?}", err);

      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::GenerateVideo,
        service: GenerationServiceProvider::Fal,
        model: selected_model,
        reason: None,
      };

      if let Err(err) = event.send(app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }

      return Err(InternalVideoError::FalError(err));
    }
  }

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::VideoGeneration,
    model: selected_model,
    provider: GenerationProvider::Fal,
    provider_job_id: job_id,
  })
}
