use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_to_gaussian::artcraft::get_storyteller_creds_or_error::get_storyteller_creds_or_error;
use crate::core::commands::enqueue::image_to_gaussian::artcraft::handle_artcraft_splat_via_router::handle_artcraft_splat_via_router;
use crate::core::commands::enqueue::image_to_gaussian::enqueue_image_to_gaussian_command::{EnqueueImageToGaussianRequest, GaussianModel};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_router::api::common_splat_model::CommonSplatModel;
use tauri::AppHandle;

pub async fn handle_gaussian_artcraft(
  request: &EnqueueImageToGaussianRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let creds = get_storyteller_creds_or_error(app, storyteller_creds_manager)?;

  match request.model {
    None => Err(GenerateError::no_model_specified()),
    Some(GaussianModel::Marble0p1Mini) => {
      handle_artcraft_splat_via_router(request, app_env_configs, &creds, CommonSplatModel::Marble0p1Mini, GenerationModel::WorldlabsMarble0p1Mini).await
    }
    Some(
      GaussianModel::Marble0p1Plus | 
      GaussianModel::WorldLabsMarble // Legacy variant — route to Plus
    ) => {
      handle_artcraft_splat_via_router(request, app_env_configs, &creds, CommonSplatModel::Marble0p1Plus, GenerationModel::WorldlabsMarble0p1Plus).await
    }
  }
}
