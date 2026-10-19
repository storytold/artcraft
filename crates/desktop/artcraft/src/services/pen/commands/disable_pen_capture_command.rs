use std::sync::Arc;

use crate::services::pen::pen_capture_state::PenCaptureState;

/// Clears one drawing surface's interest in native pen events (Linux bridge
/// over the `pen-event` channel). Paired with `enable_pen_capture`.
#[tauri::command]
pub fn disable_pen_capture_command(capture_state: tauri::State<'_, Arc<PenCaptureState>>) {
  capture_state.disable();
}
