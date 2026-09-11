use crate::core::events::sendable_event_trait::SendableEvent;
use serde_derive::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct SoraLoginSuccessEvent {
  // TODO: Reason.
}

impl SendableEvent for SoraLoginSuccessEvent {
  const FRONTEND_EVENT_NAME: &'static str = "sora-login-success";
}
