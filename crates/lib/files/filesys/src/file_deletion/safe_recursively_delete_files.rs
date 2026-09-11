use std::path::Path;

use log::warn;
use walkdir::WalkDir;

use crate::file_deletion::safe_delete_file::safe_delete_file;

/// Deletes all files in the directory tree at the given path *without deleting the directory itself*,
/// and *without deleting any subdirectories*. This is an infallible, idempotent function.
pub fn safe_recursively_delete_files(path: &Path) {
  if !path.exists() {
    warn!("Path does not exist: {:?}", path);
    return;
  }
  if !path.is_dir() {
    warn!("Path is not a directory: {:?}", path);
    return;
  }

  let walk = WalkDir::new(path);

  for entry in walk {
    if let Ok(entry) = entry {
      if entry.path().is_file() {
        safe_delete_file(entry.path());
      }
    }
  }
}
