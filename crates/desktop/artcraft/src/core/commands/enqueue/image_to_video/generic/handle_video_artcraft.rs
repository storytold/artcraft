use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_to_video::enqueue_image_to_video_command::{EnqueueImageToVideoRequest, VideoModel};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::{GenerateKling16ProAspectRatio, GenerateKling16ProImageToVideoRequest};
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::{GenerateKling21MasterAspectRatio, GenerateKling21MasterImageToVideoRequest};
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::{GenerateKling21ProAspectRatio, GenerateKling21ProImageToVideoRequest};
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::{GenerateVeo2AspectRatio, GenerateVeo2ImageToVideoRequest};
use artcraft_api_defs::generate::video::generate_veo_3_fast_image_to_video::GenerateVeo3FastImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_veo_3_image_to_video::{GenerateVeo3AspectRatio, GenerateVeo3ImageToVideoRequest};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
use fal_client::requests::queue::video_gen::enqueue_kling_16_pro_image_to_video::Kling16ProAspectRatio;
use fal_client::requests::webhook::video::enqueue_veo_2_image_to_video_webhook::Veo2AspectRatio;
use idempotency::uuid::generate_random_uuid;
use log::{error, info};
use storyteller_client::endpoints::generate::video::generate_kling_16_pro_image_to_video::generate_kling_16_pro_image_to_video;
use storyteller_client::endpoints::generate::video::generate_kling_21_master_image_to_video::generate_kling_21_master_image_to_video;
use storyteller_client::endpoints::generate::video::generate_kling_21_pro_image_to_video::generate_kling_21_pro_image_to_video;
use storyteller_client::endpoints::generate::video::generate_seedance_1_0_lite_image_to_video::generate_seedance_1_0_lite_image_to_video;
use storyteller_client::endpoints::generate::video::generate_veo_2_image_to_video::generate_veo_2_image_to_video;
use storyteller_client::endpoints::generate::video::generate_veo_3_fast_image_to_video::generate_veo_3_fast_image_to_video;
use storyteller_client::endpoints::generate::video::generate_veo_3_image_to_video::generate_veo_3_image_to_video;
use storyteller_client::utils::api_host::ApiHost;
use tauri::AppHandle;

pub async fn handle_video_artcraft(
  request: EnqueueImageToVideoRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => {
      error!("No Artcraft credentials are set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_artcraft_credentials(GenerationAction::GenerateVideo);

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err); // Fail open.
      }
      
      return Err(GenerateError::needs_storyteller_credentials());
    },
  };
  
  //let api_key = fal_creds_manager.get_key_required()
  //    .map_err(|err| {
  //      error!("EnqueueTextToImage FAL api key required: {:?}", err);
  //      InternalVideoError::NeedsFalApiKey
  //    })?;


  info!("Calling Artcraft image to video...");


  let uuid_idempotency_token = generate_random_uuid();
  
  let mut selected_model = None;
  
  let job_token = match request.model {
    None => {
      return Err(GenerateError::no_model_specified());
    }
    Some(VideoModel::Kling16Pro) => {
      info!("enqueue Kling 1.6 Pro with Artcraft API");
      selected_model = Some(GenerationModel::Kling1_6);
      let request = GenerateKling16ProImageToVideoRequest { 
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
        end_frame_image_media_token: request.end_frame_image_media_token,
        aspect_ratio: Some(GenerateKling16ProAspectRatio::WideSixteenNine),
        prompt: request.prompt,
        duration: None,
      };
      let result = generate_kling_16_pro_image_to_video(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Kling 1.6 video generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Kling 1.6 video generation: {:?}", err);
          return Err(GenerateError::from(err));
        }
      }
    }
    Some(VideoModel::Kling21Master) => {
      info!("enqueue Kling 2.1 Master with Artcraft API");
      selected_model = Some(GenerationModel::Kling21Master);
      let request = GenerateKling21MasterImageToVideoRequest {
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
        aspect_ratio: Some(GenerateKling21MasterAspectRatio::WideSixteenNine),
        prompt: request.prompt,
        duration: None,
      };
      let result = generate_kling_21_master_image_to_video(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Kling 2.1 Master video generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Kling 2.1 Master video generation: {:?}", err);
          return Err(GenerateError::from(err));
        }
      }
    }
    Some(VideoModel::Kling21Pro) => {
      info!("enqueue Kling 2.1 Pro with Artcraft API");
      selected_model = Some(GenerationModel::Kling21Pro);
      let request = GenerateKling21ProImageToVideoRequest {
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
        end_frame_image_media_token: request.end_frame_image_media_token,
        aspect_ratio: Some(GenerateKling21ProAspectRatio::WideSixteenNine),
        prompt: request.prompt,
        duration: None,
      };
      let result = generate_kling_21_pro_image_to_video(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Kling 2.1 Pro video generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Kling 2.1 Pro video generation: {:?}", err);
          return Err(GenerateError::from(err));
        }
      }
    }
    Some(VideoModel::Seedance10Lite) => {
      info!("enqueue Seedance 1.0 Lite with Artcraft API");
      selected_model = Some(GenerationModel::Seedance10Lite);
      let request = GenerateSeedance10LiteImageToVideoRequest {
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
        end_frame_image_media_token: request.end_frame_image_media_token,
        prompt: request.prompt,
        resolution: None,
        duration: None,
      };
      let result = generate_seedance_1_0_lite_image_to_video(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Seedance 1.0 Lite video generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Seedance 1.0 Lite video generation: {:?}", err);
          return Err(GenerateError::from(err));
        }
      }
    }
    Some(VideoModel::Veo2) => {
      info!("enqueue Veo 2 with Artcraft API");
      selected_model = Some(GenerationModel::Veo2);
      let request = GenerateVeo2ImageToVideoRequest {
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
        aspect_ratio: Some(GenerateVeo2AspectRatio::WideSixteenNine),
        prompt: request.prompt,
        duration: None,
      };
      let result = generate_veo_2_image_to_video(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Veo 2 video generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Veo 2 video generation: {:?}", err);
          return Err(GenerateError::from(err));
        }
      }
    }
    Some(VideoModel::Veo3) => {
      info!("enqueue Veo 3 with Artcraft API");
      selected_model = Some(GenerationModel::Veo3);
      let request = GenerateVeo3ImageToVideoRequest {
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
        aspect_ratio: Some(GenerateVeo3AspectRatio::WideSixteenNine),
        prompt: request.prompt,
        duration: None,
        resolution: None,
        generate_audio: None,
      };
      let result = generate_veo_3_image_to_video(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Veo 3 video generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Veo 3 video generation: {:?}", err);
          return Err(GenerateError::from(err));
        }
      }
    }
    Some(VideoModel::Veo3Fast) => {
      info!("enqueue Veo 3 Fast with Artcraft API");
      selected_model = Some(GenerationModel::Veo3Fast);
      let request = GenerateVeo3FastImageToVideoRequest {
        uuid_idempotency_token,
        media_file_token: request.image_media_token,
        prompt: request.prompt,
        duration: None,
        resolution: None,
        generate_audio: None,
      };
      let result = generate_veo_3_fast_image_to_video(
        &app_env_configs.storyteller_host,
        Some(&creds),
        request,
      ).await;
      match result {
        Ok(enqueued) => {
          info!("Successfully enqueued Artcraft Veo 3 video generation");
          enqueued.inference_job_token
        }
        Err(err) => {
          error!("Failed to use Artcraft Veo 3 video generation: {:?}", err);
          return Err(GenerateError::from(err));
        }
      }
    }
  };

  info!("Successfully enqueued video generation");
  
  Ok(TaskEnqueueSuccess {
    task_type: TaskType::VideoGeneration,
    model: selected_model,
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_token.to_string()),
  })
}
