use std::path::PathBuf;

use errors::AnyhowResult;
use errors::bail;

pub fn check_file_exists(path: &PathBuf) -> AnyhowResult<()> {
  if !path.exists() {
    bail!("Path doesn't exist: {:?}", path);
  }
  if !path.is_file() {
    bail!("Path isn't a file: {:?}", path);
  }
  Ok(())
}
