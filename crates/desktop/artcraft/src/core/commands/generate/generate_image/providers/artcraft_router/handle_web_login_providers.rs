// Which AI provider the user picked (Grok, Runway, ...).
use enums::common::generation_provider::GenerationProvider;
// Logging macro; used instead of println! per AGENTS.md.
use log::warn;

// The error type every generate command returns to the frontend.
use crate::core::commands::enqueue::generate_error::GenerateError;
// What a successful enqueue returns (the new task's id).
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
// The request the frontend sent when the user clicked Generate.
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
// The saved browser-login session (cookies) for providers that have no API key.
use crate::core::providers::credentials::payload::web_login::WebLoginData;

/// Handle image generation for providers that authenticate via web login.
///
/// Not yet implemented — placeholder for Grok, Runway, Higgsfield, etc.
pub async fn handle_web_login_provider(
  // The user's generate request (unused until this is implemented, hence the underscore).
  _request: &TauriGenerateImageRequest,
  // Which provider was chosen; used in the log line and error message.
  provider: GenerationProvider,
  // The saved web-login session (unused for now).
  _web_login: &WebLoginData,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  // Return an error instead of panicking: this runs inside a Tauri command, and the
  // frontend can show a "not supported yet" message but cannot recover from a panic.
  // Log it first so developers can see which provider hit this path.
  warn!("handle_web_login_provider: web login image generation is not supported via the router path yet: provider={:?}", provider);
  // Hand the frontend a normal error it can display.
  Err(GenerateError::NotYetImplemented(
    format!("Web login image generation for provider {:?} is not yet supported via the router path", provider),
  ))
}
