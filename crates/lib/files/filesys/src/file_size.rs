use std::path::Path;

use errors::{anyhow, AnyhowResult};

/// Return the file size of the file.
/// Only works for *files*, not directories or symlinks
pub fn file_size<P: AsRef<Path>>(filename: P) -> AnyhowResult<u64> {
  let metadata = std::fs::metadata(filename.as_ref())?;

  // TODO(bt,2023-11-29): Return io::Result and errors here.
  if !metadata.is_file() {
    Err(anyhow!("path {:?} is not a file", filename.as_ref()))
  } else if metadata.is_symlink() {
    Err(anyhow!("path {:?} is a symlink", filename.as_ref()))
  } else {
    Ok(metadata.len())
  }
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::file_size::file_size;

  fn test_file(path_from_repo_root: &str) -> PathBuf {
    // https://doc.rust-lang.org/cargo/reference/environment-variables.html
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push(format!("../../../../{}", path_from_repo_root));
    path
  }

  #[test]
  pub fn test_file_size() {
    // Success case
    let path = test_file("test_data/audio/flac/zelda_ocarina_small_item.flac");
    assert_eq!(file_size(path).unwrap(), 115);

    // Error case
    assert!(file_size("non/existing/path").is_err());
  }
}
