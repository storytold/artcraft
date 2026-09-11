use std::path::Path;

use errors::{AnyhowResult, bail};

pub fn check_directory_exists<P: AsRef<Path>>(path: P) -> AnyhowResult<()> {
  let check_path = path.as_ref();

  if !check_path.exists() {
    bail!("Path doesn't exist: {:?}", check_path);
  }
  if !check_path.is_dir() {
    bail!("Path isn't a directory: {:?}", check_path);
  }
  Ok(())
}
