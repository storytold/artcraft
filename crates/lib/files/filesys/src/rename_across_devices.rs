use std::error::Error;
use std::fmt;
use std::path::Path;

use log::error;

use crate::is_filesystem_full_error::is_filesystem_full_error;

#[derive(Debug)]
pub enum RenameError {
  StorageFull,
  IoError(std::io::Error),
}

impl Error for RenameError {}

impl fmt::Display for RenameError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      RenameError::StorageFull => write!(f, "RenameError: storage is full"),
      RenameError::IoError(err) => write!(f, "{:?}", err),
    }
  }
}

impl From<std::io::Error> for RenameError {
  fn from(error: std::io::Error) -> Self {
    RenameError::IoError(error)
  }
}

/// Rename a file.
/// Ordinary rename will fail in Linux if it is across physical devices.
/// This function will perform a copy followed by delete in that case.
/// In both cases, this function will overwrite the destination if it already exists.
pub fn rename_across_devices<P: AsRef<Path>, Q: AsRef<Path>>(from: P, to: Q) -> Result<(), RenameError> {
  let result = std::fs::rename(&from, &to);

  let err = match result {
    Ok(_) => return Ok(()), // Rename succeeded.
    Err(err) => err,
  };

  // Nearly a third of `ErrorKind` is nightly rust, so we're going to have to match on
  // unix error codes until the rest of the ErrorKind enum variants are stable.
  // The error codes are maintained in sys/unix/voice_conversion_to_weights - decode_error_kind(i32)
  const E_CROSSES_DEVICES : i32 = 18; // pub const EXDEV: ::c_int = 18;

  if is_filesystem_full_error(&err) {
    error!("Filesystem is full during rename.");
    return Err(RenameError::StorageFull);
  }

  match err.raw_os_error() {
    Some(E_CROSSES_DEVICES) => {
      // NB: Fall through.
    }
    _ => {
      // Something else happened. Return original error.
      return Err(RenameError::IoError(err));
    }
  }

  // NB: In production we've seen std::fs::copy silently succeed, yet copy zero bytes. The reason
  // is more than likely that the filesystem is full. We'll check the number of copied bytes to
  // confirm. Moreover, the Rust docs say wrt std::fs::copy, "On success, the total number of bytes
  // copied is returned and it is equal to the length of the to file as reported by metadata."
  let original_file_size = std::fs::metadata(from.as_ref())?.len();

  let num_bytes_copied = std::fs::copy(&from, &to)?;

  if num_bytes_copied != original_file_size {
    error!("Filesystem is full during copy. Not all bytes copied.");
    return Err(RenameError::StorageFull);
  }

  // An emulated "rename" would delete the source file.
  std::fs::remove_file(&from)?;

  Ok(())
}
