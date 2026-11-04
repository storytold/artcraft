use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::window::main_window_position::MainWindowPosition;
use crate::core::state::window::main_window_size::MainWindowSize;
use crate::core::utils::window::position_main_window::position_main_window;
use crate::core::utils::window::resize_main_window::resize_main_window;
use log::info;
use tauri::AppHandle;

pub fn initially_size_and_position_windows(
  app: &AppHandle,
  root: &AppDataRoot,
) {

  println!("Sizing and positioning window...");

  // NB: On Linux (GTK), restoring the persisted physical size is unreliable. Under Wayland
  // with fractional scaling, GTK reports an integer scale factor, so the saved size exceeds
  // the monitor and grows on every launch until the window controls are off-screen. The
  // window manager already sizes and places the window sensibly, so let it.
  if cfg!(target_os = "linux") {
    info!("Skipping restore of persisted window size on Linux.");
  } else {
    restore_window_size(app, root);
  }

  match MainWindowPosition::from_filesystem_configs(&root) {
    Ok(None) => {}
    Ok(Some(pos)) => {
      println!("Moving window to: {:?}", pos);
      let result = position_main_window(app, &pos);
      if let Err(err) = result {
        eprintln!("Could not set window position: {:?}", err);
      }
    }
    Err(err) => {
      eprintln!("Failed to read window position from disk: {:?}", err);
    }
  }
}

fn restore_window_size(
  app: &AppHandle,
  root: &AppDataRoot,
) {
  match MainWindowSize::from_filesystem_configs(&root) {
    Ok(None) => {}
    Ok(Some(size)) => {
      println!("Resizing window to: {:?}", size);
      let result = resize_main_window(app, &size);
      if let Err(err) = result {
        eprintln!("Could not set window size: {:?}", err);
      }
    }
    Err(err) => {
      eprintln!("Failed to read window size from disk: {:?}", err);
    }
  }
}
