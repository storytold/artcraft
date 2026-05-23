use crate::core::commands::enqueue::generate_error::{GenerateError, ProviderFailureReason};
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_enqueue_failure_event::GenerationEnqueueFailureEvent;
use grok_consumer_client::error::grok_error::GrokError;
use grok_consumer_client::error::grok_specific_api_error::GrokSpecificApiError;
use tauri::AppHandle;

pub async fn maybe_notify_frontend_of_grok_errors(
  app: &AppHandle,
  error: &GenerateError,
) {
  match error {
    GenerateError::ProviderFailure(ProviderFailureReason::GrokError(error)) => {
      grok_error(app, error);
    }
    _ => {
      // Do nothing for other types of errors
    }
  }
}

fn grok_error(
  app: &AppHandle,
  error: &GrokError,
) {
  match error {
    GrokError::ApiSpecific(GrokSpecificApiError::TooManyVideos) => {
      let event = GenerationEnqueueFailureEvent {
        action: GenerationAction::GenerateVideo,
        service: GenerationServiceProvider::Grok,
        model: None,
        reason: Some("You've generated too many Grok videos. Please wait for more quota from Grok.".to_string()),
      };
      event.send_infallible(&app);
    }
    GrokError::ApiSpecific(_) => {}
    GrokError::Client(_) => {}
    GrokError::ApiGeneric(_) => {}
  }
}
