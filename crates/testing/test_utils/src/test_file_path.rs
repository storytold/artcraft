use std::path::{Path, PathBuf};

use errors::{anyhow, AnyhowResult};

/// Refer to test files using the path from repo root and return a canonical path.
///
/// NB: The path must exist or the canonicalization will return an error!
///
/// (If each library had to deal with this problem separately, they would have to concern
/// themselves with the number of directories between the Cargo.toml project declaration
/// and the test directory, ie. this differs based on code nestedness.)
pub fn test_file_path<P: AsRef<Path>>(path_from_repo_root: P) -> AnyhowResult<PathBuf> {
  // https://doc.rust-lang.org/cargo/reference/environment-variables.html
  let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
  let file = path_from_repo_root
      .as_ref()
      .to_str()
      .ok_or(anyhow!("path cannot convert to string"))?;
  path.push(format!("../../../{}", file));
  println!(" >>> path = {:?}", path);
  Ok(path.canonicalize()?)

}

#[cfg(test)]
mod tests {
  use super::test_file_path;

  #[test]
  fn assert_canonicalized() {
    // NB: We can't assert the exact paths since each machine (dev, CI) differs,
    // but we can make assertions
    let str_path = "test_data/audio/flac/zelda_ocarina_small_item.flac";
    let path = test_file_path(str_path).unwrap();

    assert!(path.is_absolute());
    assert!(path.exists());
    assert!(path.ends_with(str_path));
    assert_eq!(path.canonicalize().unwrap(), path);
  }
}
