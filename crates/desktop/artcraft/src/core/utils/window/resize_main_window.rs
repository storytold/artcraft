use crate::core::state::window::main_window_size::MainWindowSize;
use crate::core::windows::main_window::constants::{MAIN_WINDOW_MIN_HEIGHT, MAIN_WINDOW_MIN_WIDTH, MAIN_WINDOW_NAME};
use tauri::{AppHandle, Manager, PhysicalSize};

/// Try to resize the main window at startup.
/// If it doesn't meet certain sizing heuristics, abandon manual resize and let the OS
/// decide how to size the app.
pub fn resize_main_window(
  app: &AppHandle,
  size: &MainWindowSize,
) -> errors::AnyhowResult<()> {

  let mut resize_width = size.width;
  let mut resize_height = size.height;
  let mut resize_was_corrected = false;

  if resize_width < MAIN_WINDOW_MIN_WIDTH {
    resize_width = MAIN_WINDOW_MIN_WIDTH;
    resize_was_corrected = true;
  }
  if resize_height < MAIN_WINDOW_MIN_HEIGHT {
    resize_height = MAIN_WINDOW_MIN_HEIGHT;
    resize_was_corrected = true;
  }

  let windows = app.windows();
  let window = windows.get(MAIN_WINDOW_NAME)
      .ok_or_else(|| anyhow::anyhow!("Main window not found"))?;

  if let Ok(Some(monitor)) = window.current_monitor() {
    let scale_factor = monitor.scale_factor();

    if scale_factor > 1.0 {

      let min_width = MAIN_WINDOW_MIN_WIDTH as f64 * scale_factor;
      let min_height = MAIN_WINDOW_MIN_HEIGHT as f64 * scale_factor;

      // Is this safe? https://users.rust-lang.org/t/convert-an-f64-to-an-i32/50991/4
      let min_width = min_width as u32;
      let min_height = min_height as u32;

      if resize_width < min_width {
        resize_width = min_width;
        resize_was_corrected = true;
      }
      if resize_height < min_height {
        resize_height = min_height;
        resize_was_corrected = true;
      }
    }
  }

  if resize_was_corrected {
    println!("Resizing window to: {}x{} (corrected from {}x{})",
      resize_width, resize_height, size.width, size.height);
  } else {
    println!("Resizing window to: {}x{} (no correction needed)", resize_width, resize_height);
  }

  window.set_size(PhysicalSize::new(resize_width, resize_height))?;

  Ok(())
}
