use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;

/// Send a signal to the frontend that an account state has changed: login, 
/// logout, invalidated, etc.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct RefreshAccountStateEvent {
  /// The frontend can optionally decide whether it wants to refresh based 
  /// on the impacted provider account.
  pub provider: Option<GenerationProvider>,
}

impl BasicSendableEvent for RefreshAccountStateEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::RefreshAccountStateEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Success;
}
