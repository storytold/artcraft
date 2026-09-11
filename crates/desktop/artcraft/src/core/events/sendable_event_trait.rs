use crate::core::events::sendable_event_error::SendableEventError;
use log::info;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

/// Implement this on a Serializable object to be able to send it as an event to the frontend.
#[deprecated(note = "Use BasicSendableEvent instead as it wraps the event with status and data fields.")]
pub trait SendableEvent : Serialize {
  /// This is the name of the event that the frontend subscribes to.
  const FRONTEND_EVENT_NAME: &'static str;
  
  /// Default implementation of send(). 
  /// This serializes and sends the event to the frontend.
  #[deprecated(note = "Use BasicSendableEvent instead as it wraps the event with status and data fields.")]
  fn send(&self, app: &AppHandle) -> Result<(), SendableEventError> {
    info!("Sending event to frontend: {}", Self::FRONTEND_EVENT_NAME);
    let result = app.emit(Self::FRONTEND_EVENT_NAME, self);
    if let Err(err) = result {
      return Err(SendableEventError::from(err));
    }
    Ok(())
  }
}
