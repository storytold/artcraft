use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::window::main_window_position::MainWindowPosition;
use crate::core::state::window::main_window_size::MainWindowSize;
use crate::core::utils::window::position_main_window::position_main_window;
use crate::core::utils::window::resize_main_window::resize_main_window;
use log::{error, info};
use tauri::AppHandle;

pub fn initially_size_and_position_windows(
  app: &AppHandle,
  root: &AppDataRoot,
) {

  info!("Sizing and positioning window...");

  match MainWindowSize::from_filesystem_configs(&root) {
    Ok(None) => {}
    Ok(Some(size)) => {
      info!("Resizing window to: {:?}", size);
      let result = resize_main_window(app, &size);
      if let Err(err) = result {
        error!("Could not set window size: {:?}", err);
      }
    }
    Err(err) => {
      error!("Failed to read window size from disk: {:?}", err);
    }
  }

  match MainWindowPosition::from_filesystem_configs(&root) {
    Ok(None) => {}
    Ok(Some(pos)) => {
      info!("Moving window to: {:?}", pos);
      let result = position_main_window(app, &pos);
      if let Err(err) = result {
        error!("Could not set window position: {:?}", err);
      }
    }
    Err(err) => {
      error!("Failed to read window position from disk: {:?}", err);
    }
  }
}