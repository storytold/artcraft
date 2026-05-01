use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;

use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::providers::artcraft::legacy::artcraft_flux_2_lora_angles::handle_flux_2_lora_angles;
use crate::core::commands::generate::generate_image::providers::artcraft::legacy::artcraft_flux_dev_juggernaut_inpaint::handle_flux_dev_juggernaut_inpaint;
use crate::core::commands::generate::generate_image::providers::artcraft::legacy::artcraft_flux_pro_kontext_edit::handle_flux_pro_kontext_edit;
use crate::core::commands::generate::generate_image::providers::artcraft::legacy::artcraft_qwen_edit_2511_angles::handle_qwen_edit_2511_angles;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::commands::generate::generate_image::utils::parse_semantic_media_files::SemanticMediaFiles;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;

/// Handle image generation via legacy model-specific paths.
///
/// Dispatches to dedicated handlers for each supported legacy model.
pub async fn handle_artcraft_via_legacy(
  request: &TauriGenerateImageRequest,
  semantic_media_files: &SemanticMediaFiles,
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let model = request.model.ok_or(GenerateError::no_model_specified())?;

  match model {
    TauriImageModel::FluxDevJuggernaut => {
      handle_flux_dev_juggernaut_inpaint(request, semantic_media_files, creds, app_env_configs).await
    }
    TauriImageModel::FluxProKontextMax => {
      handle_flux_pro_kontext_edit(request, semantic_media_files, creds, app_env_configs).await
    }
    TauriImageModel::QwenEdit2511Angles => {
      handle_qwen_edit_2511_angles(request, semantic_media_files, creds, app_env_configs).await
    }
    TauriImageModel::Flux2LoraAngles => {
      handle_flux_2_lora_angles(request, semantic_media_files, creds, app_env_configs).await
    }
    TauriImageModel::Midjourney | TauriImageModel::Recraft3 => {
      Err(GenerateError::NotYetImplemented(
        format!("Model {:?} is not supported by provider Artcraft", model),
      ))
    }
    other => {
      Err(GenerateError::NotYetImplemented(
        format!("Model {:?} was incorrectly handled", other),
      ))
    }
  }
}
