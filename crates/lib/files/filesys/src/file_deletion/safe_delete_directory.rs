use std::fs;
use std::path::Path;

use log::info;
use log::warn;

/// Safely deletes a directory without panicking. Errors are logged.
/// This is an infallible, idempotent function.
pub fn safe_delete_directory<P: AsRef<Path>>(directory_path: P) {
  let printable_name = directory_path.as_ref().to_str().unwrap_or("bad directory");
  match fs::remove_dir_all(&directory_path) {
    Ok(_) => info!("Temp directory deleted: {}", printable_name),
    Err(e) => warn!("Could not delete temp directory{:?} (not a fatal error): {:?}",
                    printable_name, e),
  }
}
