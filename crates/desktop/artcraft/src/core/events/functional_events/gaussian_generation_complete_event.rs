use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;
use tokens::tokens::media_files::MediaFileToken;
use url::Url;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct GaussianGenerationCompleteEvent {
  pub generated_gaussian: Option<GeneratedGaussian>,
  pub maybe_frontend_subscriber_id: Option<String>,
  pub maybe_frontend_subscriber_payload: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct GeneratedGaussian {
  pub media_token: MediaFileToken,
  pub cdn_url: Url,
  pub maybe_thumbnail_template: Option<String>,
}

impl BasicSendableEvent for GaussianGenerationCompleteEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::GaussianGenerationCompleteEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Success;
}
