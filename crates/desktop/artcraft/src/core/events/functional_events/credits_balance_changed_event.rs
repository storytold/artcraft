use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;
use tokens::tokens::media_files::MediaFileToken;
use url::Url;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct CreditsBalanceChangedEvent {
  // NB: We don't know how much was added or removed, just that it changed.
  // The frontend should re-query the balance
}

impl BasicSendableEvent for CreditsBalanceChangedEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::CreditsBalanceChangedEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Success;
}
