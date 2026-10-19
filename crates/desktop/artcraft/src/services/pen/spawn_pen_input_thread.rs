use std::sync::Arc;

use crate::services::pen::pen_capture_state::PenCaptureState;
use crate::services::pen::x11_pen_reader::run_pen_reader;
use errors::AnyhowResult;
use tauri::AppHandle;

/// Starts the native pen input reader (Linux only; the reader degrades to a
/// warning when no X display or pen hardware is present). On other platforms
/// the frontend reads pen data from DOM `PointerEvent`s and the thread is not
/// started at all.
pub fn spawn_pen_input_thread(
  app: &AppHandle,
  capture_state: Arc<PenCaptureState>,
) -> AnyhowResult<()> {
  let app_handle = app.clone();

  std::thread::Builder::new()
    .name("pen-input-reader".to_string())
    .spawn(move || {
      if let Err(err) = run_pen_reader(app_handle, capture_state) {
        log::info!("pen input reader stopped: {err:#}");
      }
    })?;

  Ok(())
}
