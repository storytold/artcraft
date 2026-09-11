use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;
use tokens::tokens::media_files::MediaFileToken;
use url::Url;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct MediaFileDeletedEvent {
  pub media_file_token: MediaFileToken,
}

impl BasicSendableEvent for MediaFileDeletedEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::MediaFileDeletedEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Success;
}
