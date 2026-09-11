use std::path::Path;

use crate::file_deletion::safe_delete_file::safe_delete_file;

/// Safely deletes a "possible" file (calling on None is a no-op) without panicking. Errors are logged.
/// This is an infallible, idempotent function.
pub fn safe_delete_possible_file<P: AsRef<Path>>(maybe_file_path: Option<P>) {
  if let Some(file_path) = maybe_file_path {
    safe_delete_file(file_path)
  }
}
