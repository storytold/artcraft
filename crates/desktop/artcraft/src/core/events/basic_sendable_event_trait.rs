use crate::core::events::sendable_event_error::SendableEventError;
use enums::tauri::ux::tauri_event_name::TauriEventName;
use log::{error, info};
use serde::Serialize;
use std::fmt::Debug;
use tauri::{AppHandle, Emitter};

// Tagged enums here are waaay too "Rustic"
// #[derive(Clone, Serialize)]
// #[serde(rename_all = "camelCase", rename_all_fields = "camelCase", tag = "event", content = "data")]
// pub enum BasicEvent<T: Serialize> {
//   Success(T),
//   Failure(T),
// }

#[derive(Copy, Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum BasicEventStatus {
  Success,
  Failure,
}

/// Wrap the event with "status" and "data" fields.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
struct BasicEventWrapper<T: Serialize + Debug> {
  status: BasicEventStatus,
  data: T,
}

pub trait BasicSendableEvent : Clone + Debug + Serialize {
  /// This is the name of the event that the frontend subscribes to.
  const FRONTEND_EVENT_NAME: TauriEventName;

  /// This is the status of the event: Success, Failure, etc.
  const EVENT_STATUS: BasicEventStatus;

  /// Default implementation of send().
  /// This serializes and sends the event to the frontend.
  fn send(&self, app: &AppHandle) -> Result<(), SendableEventError> {
    let wrapped = BasicEventWrapper {
      status: Self::EVENT_STATUS,
      data: self.clone(),
    };
    info!("Sending event to frontend: {} ; payload = {:?}", Self::FRONTEND_EVENT_NAME.to_str(), wrapped);
    let result = app.emit(Self::FRONTEND_EVENT_NAME.to_str(), wrapped);
    if let Err(err) = result {
      return Err(SendableEventError::from(err));
    }
    Ok(())
  }
  
  fn send_infallible(&self, app: &AppHandle) {
    if let Err(err) = self.send(app) {
      // Fail open
      error!("Failed to send event `{}`: {:?}", Self::FRONTEND_EVENT_NAME.to_str(), err);
    }
  }
}
