use enums::common::generation_provider::GenerationProvider;

use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::providers::credentials::payload::web_login::WebLoginData;

/// Handle image generation for providers that authenticate via web login.
///
/// Not yet implemented — placeholder for Grok, Runway, Higgsfield, etc.
pub async fn handle_web_login_provider(
  _request: &TauriGenerateImageRequest,
  _provider: GenerationProvider,
  _web_login: &WebLoginData,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  unimplemented!("Web login provider image generation is not yet supported via the router path")
}
