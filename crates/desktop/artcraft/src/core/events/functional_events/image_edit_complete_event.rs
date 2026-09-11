use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;
use tokens::tokens::media_files::MediaFileToken;
use url::Url;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct ImageEditCompleteEvent {
  // pub source_media_token: MediaFileToken,
  pub edited_images: Vec<EditedImage>,
  pub maybe_frontend_subscriber_id: Option<String>,
  pub maybe_frontend_subscriber_payload: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct EditedImage {
  pub media_token: MediaFileToken,
  pub cdn_url: Url,
  pub maybe_thumbnail_template: Option<String>,
}

impl BasicSendableEvent for ImageEditCompleteEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::ImageEditCompleteEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Success;
}
