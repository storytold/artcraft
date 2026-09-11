use std::path::Path;

use log::info;
use log::warn;

/// Safely deletes a file without panicking. Errors are logged.
/// This is an infallible, idempotent function.
pub fn safe_delete_file<P: AsRef<Path>>(file_path: P) {
  let printable_name = file_path.as_ref().to_str().unwrap_or("bad filename");
  match std::fs::remove_file(&file_path) {
    Ok(_) => info!("Temp file deleted: {}", printable_name),
    Err(e) => warn!("Could not delete temp file {:?} (not a fatal error): {:?}",
                    printable_name, e),
  }
}
