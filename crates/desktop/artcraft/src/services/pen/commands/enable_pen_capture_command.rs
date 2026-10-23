use std::sync::Arc;

use crate::services::pen::pen_capture_state::PenCaptureState;

/// Marks a drawing surface as wanting native pen events (Linux bridge over the
/// `pen-event` channel). Counted per mounted surface; each enable must be
/// matched with a `disable_pen_capture` call on unmount.
#[tauri::command]
pub fn enable_pen_capture_command(capture_state: tauri::State<'_, Arc<PenCaptureState>>) {
  capture_state.enable();
}
