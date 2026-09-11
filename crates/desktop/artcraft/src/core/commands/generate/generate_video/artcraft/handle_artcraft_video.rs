use crate::core::api_adapters::models::video::tauri_video_model_to_generation_model::tauri_video_model_to_generation_model;
use crate::core::api_adapters::models::video::tauri_video_model_to_router_model::tauri_video_model_to_router_model;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_video::artcraft::get_storyteller_creds_or_error::get_storyteller_creds_or_error;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_video_via_router::handle_artcraft_video_via_router;
use crate::core::commands::generate::generate_video::request::TauriGenerateVideoRequest;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use tauri::AppHandle;

pub async fn handle_video_artcraft(
  request: &TauriGenerateVideoRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = get_storyteller_creds_or_error(app, storyteller_creds_manager)?;

  let model = match request.model {
    None => return Err(GenerateError::no_model_specified()),
    Some(model) => model,
  };

  let router_model = tauri_video_model_to_router_model(model);
  let generation_model = tauri_video_model_to_generation_model(model);

  handle_artcraft_video_via_router(request, app_env_configs, &creds, router_model, generation_model).await
}
