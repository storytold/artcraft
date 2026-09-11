use crate::core::events::basic_sendable_event_trait::{BasicEventStatus, BasicSendableEvent};
use enums::tauri::ux::tauri_event_name::TauriEventName;
use serde_derive::Serialize;
use std::path::PathBuf;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct FlashFileDownloadErrorEvent {
  pub error_type: FlashFileDownloadErrorType,
  pub filename: Option<PathBuf>,
  pub message: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum FlashFileDownloadErrorType {
  FileAlreadyDownloaded,
  FilesystemError,
  NetworkError,
  UnknownError,
}

impl BasicSendableEvent for FlashFileDownloadErrorEvent {
  const FRONTEND_EVENT_NAME: TauriEventName = TauriEventName::FlashFileDownloadErrorEvent;
  const EVENT_STATUS: BasicEventStatus = BasicEventStatus::Failure;
}
