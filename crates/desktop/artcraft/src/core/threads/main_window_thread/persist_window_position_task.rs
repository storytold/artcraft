use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::window::main_window_position::MainWindowPosition;
use errors::AnyhowResult;
use log::info;
use memory_store::clone_slot::CloneSlot;
use tauri::Window;

pub async fn persist_window_position_task(
  window: &Window,
  app_data_root: &AppDataRoot,
  window_pos_slot: &CloneSlot<MainWindowPosition>,
) -> AnyhowResult<()> {

  let current_window_position = MainWindowPosition::from_window(window)?;
  let current_physical_pos = window.outer_position()?;

  let mut save_size_to_disk = true;

  if let Ok(Some(old_size)) = window_pos_slot.get_clone() {
    if old_size.matches_physical_position(&current_physical_pos) {
      save_size_to_disk = false;
    }
  }

  if save_size_to_disk {
    info!("Saving window position configs to disk...");
    current_window_position.persist_to_filesystem(app_data_root)?;
    window_pos_slot.set_clone(&current_window_position)?;
  }

  Ok(())
}
