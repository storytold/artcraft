use crate::core::commands::enqueue::image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::commands::enqueue::image::internal_image_error::InternalImageError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::model::image_models::ImageModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::generate::image::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageRequest;
use artcraft_api_defs::generate::image::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::generate::image::generate_flux_1_dev_text_to_image::generate_flux_1_dev_text_to_image;
use storyteller_client::generate::image::generate_flux_1_schnell_text_to_image::generate_flux_1_schnell_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_text_to_image::generate_flux_pro_11_text_to_image;
use storyteller_client::generate::image::generate_flux_pro_11_ultra_text_to_image::generate_flux_pro_11_ultra_text_to_image;
use tauri::AppHandle;

pub async fn handle_image_artcraft(
  request: EnqueueTextToImageRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, InternalImageError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      error!("No Artcraft credentials are set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_artcraft_credentials(GenerationAction::GenerateImage);

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      return Err(InternalImageError::NeedsStorytellerCredentials);
    },
  };
  
  info!("Calling Artcraft text to image...");

  let uuid_idempotency_token = generate_random_uuid();
  
  let mut selected_model;
  
  let job_token = match request.model {
    None => {
      return Err(InternalImageError::NoModelSpecified);
    }
    Some(ImageModel::GptImage1) => {
      return Err(InternalImageError::AnyhowError(anyhow!("wrong logic: artcraft is handling sora images")));
    }
    Some(ImageModel::Recraft3) => {
      return Err(InternalImageError::AnyhowError(anyhow!("not yet implemented in Artcraft")));
    }
    Some(ImageModel::Flux1Dev) => {
      info!("enqueue Flux 1 Dev");
      selected_model = GenerationModel::Flux1Dev;
      let request = GenerateFlux1DevTextToImageRequest {
        uuid_idempotency_token,
        prompt: request.prompt,
        aspect_ratio: None,
        num_images: None,
      };
      let result = generate_flux_1_dev_text_to_image(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Flux 1 Dev text to image generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Flux 1 Dev text to image generation: {:?}", err);
          return Err(InternalImageError::StorytellerError(err));
        }
      }
    }
    Some(ImageModel::Flux1Schnell) => {
      info!("enqueue Flux 1 Schnell");
      selected_model = GenerationModel::Flux1Schnell;
      let request = GenerateFlux1SchnellTextToImageRequest {
        uuid_idempotency_token,
        prompt: request.prompt,
        aspect_ratio: None,
        num_images: None,
      };
      let result = generate_flux_1_schnell_text_to_image(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Flux 1 Schnell text to image generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Flux 1 Schnell text to image generation: {:?}", err);
          return Err(InternalImageError::StorytellerError(err));
        }
      }
    }
    Some(ImageModel::FluxPro11) => {
      info!("enqueue Flux Pro 1.1");
      selected_model = GenerationModel::FluxPro11;
      let request = GenerateFluxPro11TextToImageRequest {
        uuid_idempotency_token,
        prompt: request.prompt,
        aspect_ratio: None,
        num_images: None,
      };
      let result = generate_flux_pro_11_text_to_image(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Flux Pro 1.1 text to image generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Flux Pro 1.1 text to image generation: {:?}", err);
          return Err(InternalImageError::StorytellerError(err));
        }
      }
    }
    Some(ImageModel::FluxPro11Ultra) => {
      info!("enqueue Flux Pro 1.1 Ultra");
      selected_model = GenerationModel::FluxPro11Ultra;
      let request = GenerateFluxPro11UltraTextToImageRequest {
        uuid_idempotency_token,
        prompt: request.prompt,
        aspect_ratio: None,
        num_images: None,
      };
      let result = generate_flux_pro_11_ultra_text_to_image(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Flux Pro 1.1 Ultra text to image generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Flux Pro 1.1 Ultra text to image generation: {:?}", err);
          return Err(InternalImageError::StorytellerError(err));
        }
      }
    }
  };

  Ok(TaskEnqueueSuccess {
    provider: GenerationProvider::Artcraft,
    task_type: TaskType::ImageGeneration,
    model: Some(selected_model),
    provider_job_id: Some(job_token.to_string()),
  })
}
