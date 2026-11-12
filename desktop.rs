//! Windows, macOS and Linux.

use std::path::{Path, PathBuf};

use super::{FileFilter, PickKey};

/// `~/Artcraft`, shared with the Tauri app (`AppDataRoot`).
pub fn data_root() -> PathBuf {
  directories::UserDirs::new().map(|d| d.home_dir().to_path_buf()).unwrap_or_else(|| PathBuf::from(".")).join("Artcraft")
}

pub fn open_url(url: &str) -> Result<(), String> {
  open::that(url).map_err(|e| e.to_string())
}

pub fn reveal_folder(path: &Path) -> Result<(), String> {
  open::that(path).map_err(|e| e.to_string())
}

pub fn save_target(file_name: &str) -> Option<PathBuf> {
  rfd::FileDialog::new().set_file_name(file_name).save_file()
}

pub fn save_folder() -> Option<PathBuf> {
  rfd::FileDialog::new().pick_folder()
}

pub fn after_save(_path: &Path) {}

/// The dialog blocks, so the result is in the mailbox before this returns.
pub fn request_pick(key: PickKey, filters: &[FileFilter], multiple: bool) {
  let mut dialog = rfd::FileDialog::new();
  for filter in filters {
    dialog = dialog.add_filter(filter.name, filter.extensions);
  }
  let paths = if multiple { dialog.pick_files().unwrap_or_default() } else { dialog.pick_file().into_iter().collect() };
  super::post_picked(key as u32, paths);
}
