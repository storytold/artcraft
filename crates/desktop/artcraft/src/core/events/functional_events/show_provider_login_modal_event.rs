use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;
use tauri::AppHandle;

/// Send a signal to the frontend to show a modal that suggests service setup.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct ShowProviderLoginModalEvent {
  pub provider: GenerationProvider,
}

impl ShowProviderLoginModalEvent {
  pub fn send_for_provider(provider: GenerationProvider, app: &AppHandle) {
    let event = Self { provider };
    event.send_infallible(&app);
  }
}

impl BasicSendableEvent for ShowProviderLoginModalEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::ShowProviderLoginModalEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Failure;
}
