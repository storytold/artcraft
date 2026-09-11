use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::deprecated::image_inpaint::artcraft::handle_artcraft_flux_dev_juggernaut_inpaint::handle_artcraft_flux_dev_juggernaut_inpaint;
use crate::core::commands::deprecated::image_inpaint::artcraft::handle_artcraft_flux_pro_1_inpaint::handle_artcraft_flux_pro_1_inpaint;
use crate::core::commands::deprecated::image_inpaint::artcraft::handle_artcraft_flux_pro_kontext_inpaint::handle_artcraft_flux_pro_kontext_inpaint;
use crate::core::commands::deprecated::image_inpaint::artcraft::handle_artcraft_nano_banana_inpaint::handle_artcraft_nano_banana_inpaint;
use crate::core::commands::deprecated::image_inpaint::enqueue_image_inpaint_command::{EnqueueInpaintImageCommand, ImageInpaintModel};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use tauri::AppHandle;

pub async fn handle_inpaint_artcraft(
  model: ImageInpaintModel,
  request: &EnqueueInpaintImageCommand,
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  match model {
    ImageInpaintModel::FluxDevJuggernaut => {
      handle_artcraft_flux_dev_juggernaut_inpaint(
        request,
        app,
        app_data_root,
        app_env_configs,
        storyteller_creds_manager,
      ).await
    }
    ImageInpaintModel::FluxPro1 => {
      handle_artcraft_flux_pro_1_inpaint(
        request,
        app,
        app_data_root,
        app_env_configs,
        storyteller_creds_manager,
      ).await
    }
    ImageInpaintModel::FluxProKontextMax => {
      handle_artcraft_flux_pro_kontext_inpaint(
        request,
        app,
        app_data_root,
        app_env_configs,
        storyteller_creds_manager,
      ).await
    }
    ImageInpaintModel::Gemini25Flash => {
      handle_artcraft_nano_banana_inpaint(
        request,
        app,
        app_data_root,
        app_env_configs,
        storyteller_creds_manager,
      ).await
    }
  }
}
