use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::window::main_window_size::MainWindowSize;
use crate::core::utils::window::get_window_size_heuristic::get_window_size_heuristic;
use errors::AnyhowResult;
use log::info;
use memory_store::clone_slot::CloneSlot;
use tauri::Window;

pub async fn persist_window_resize_task(
  window: &Window,
  app_data_root: &AppDataRoot,
  window_size_slot: &CloneSlot<MainWindowSize>,
) -> AnyhowResult<()> {

  let current_window_size = MainWindowSize::from_window(window)?;
  let current_physical_size = get_window_size_heuristic(window)?;

  let mut save_size_to_disk = true;
  
  if let Ok(Some(old_size)) = window_size_slot.get_clone() {
    if old_size.matches_physical_size(&current_physical_size) {
      save_size_to_disk = false;
    }
  }

  if current_window_size.is_not_big_enough() {
    save_size_to_disk = false;
  }
  
  if save_size_to_disk {
    info!("Saving window size configs to disk...");
    current_window_size.persist_to_filesystem(app_data_root)?;
    window_size_slot.set_clone(&current_window_size)?;
  }

  Ok(())
}
