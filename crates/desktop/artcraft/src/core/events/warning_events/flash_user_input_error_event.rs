use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct FlashUserInputErrorEvent {
  pub message: String,
}

impl BasicSendableEvent for FlashUserInputErrorEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::FlashUserInputErrorEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Failure;
}
