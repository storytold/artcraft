use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::deprecated::text_to_image::enqueue_text_to_image_command::EnqueueTextToImageRequest;
use crate::core::commands::deprecated::text_to_image::sora::handle_gpt_image_1_sora_text_to_image::handle_gpt_image_1_sora_text_to_image;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use tauri::AppHandle;

pub async fn handle_text_to_image_sora(
  request: &EnqueueTextToImageRequest,
  app: &AppHandle,
  sora_creds_manager: &SoraCredentialManager,
  sora_task_queue: &SoraTaskQueue,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  handle_gpt_image_1_sora_text_to_image(
    request,
    app,
    sora_creds_manager,
    sora_task_queue,
  ).await
}
