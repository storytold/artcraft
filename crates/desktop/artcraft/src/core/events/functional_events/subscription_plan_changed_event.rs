use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;
use tokens::tokens::media_files::MediaFileToken;
use url::Url;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct SubscriptionPlanChangedEvent {
  // NB: We don't know what plan was changed (subscribed, upgraded, canceled, etc.),
  // just that it changed. The actual fulfillment is async anyway.
  // The frontend should re-query the subscription plan after a short delay.
}

impl BasicSendableEvent for SubscriptionPlanChangedEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::SubscriptionPlanChangedEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Success;
}
