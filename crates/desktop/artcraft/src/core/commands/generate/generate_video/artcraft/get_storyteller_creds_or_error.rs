use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::GenerationAction;
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use log::error;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use tauri::AppHandle;

pub (super) fn get_storyteller_creds_or_error(
  app: &AppHandle,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<StorytellerCredentialSet, GenerateError> {

  match storyteller_creds_manager.get_credentials()? {
    Some(creds) => Ok(creds),
    None => {
      error!("No Artcraft credentials are set. Can't perform action.");
      let event =
          GenerationEnqueueFailureEvent::no_artcraft_credentials(GenerationAction::GenerateVideo);

      event.send_infallible(app);

      Err(GenerateError::needs_storyteller_credentials())
    },
  }
}
