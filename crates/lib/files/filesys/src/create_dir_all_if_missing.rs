use std::path::Path;

use crate::directory_exists::directory_exists;

/// create_dir_all, but only if it doesn't already exist.
/// (maybe this will miss permission errors.)
pub fn create_dir_all_if_missing<P: AsRef<Path>>(path: P) -> std::io::Result<()> {
  if directory_exists(&path) {
    return Ok(())
  }
  std::fs::create_dir_all(&path)
}

#[cfg(test)]
mod tests {
  // TODO
}
