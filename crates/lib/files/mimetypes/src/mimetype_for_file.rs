use std::fs::File;
use std::io::Read;
use std::path::Path;

use crate::mimetype_for_bytes::get_mimetype_for_bytes;

const DEFAULT_BINARY_MIMETYPE : &str = "application/octet-stream";

pub fn get_mimetype_for_file<P: AsRef<Path>>(file: P) -> std::io::Result<Option<&'static str>> {
  let head = read_head(file)?;
  Ok(get_mimetype_for_bytes(&head))
}

pub fn get_mimetype_for_file_or_default<P: AsRef<Path>>(file: P) -> std::io::Result<&'static str> {
  get_mimetype_for_file(file)
      .map(|maybe_type| maybe_type.unwrap_or(DEFAULT_BINARY_MIMETYPE))
}

/// Read the leading bytes signature detection looks at (all of them for a shorter file).
pub (crate) fn read_head<P: AsRef<Path>>(file: P) -> std::io::Result<Vec<u8>> {
  let mut head = Vec::with_capacity(craft_sniff::HEAD);
  File::open(file)?
      .take(craft_sniff::HEAD as u64)
      .read_to_end(&mut head)?;
  Ok(head)
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::mimetype_for_file::{get_mimetype_for_file, get_mimetype_for_file_or_default};

  fn test_file(path_from_repo_root: &str) -> PathBuf {
    // https://doc.rust-lang.org/cargo/reference/environment-variables.html
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push(format!("../../../../{}", path_from_repo_root));
    path
  }

  #[test]
  fn test_mimetype_mp3() {
    let path = test_file("test_data/audio/mp3/super_mario_rpg_beware_the_forests_mushrooms.mp3");

    assert_eq!(get_mimetype_for_file(&path).unwrap(), Some("audio/mpeg"));
  }

  #[test]
  fn test_mimetype_mp4() {
    let path = test_file("test_data/video/mp4/golden_sun_garoh.mp4");

    assert_eq!(get_mimetype_for_file(&path).unwrap(), Some("video/mp4"));
  }

  #[test]
  fn test_mimetype_or_default_for_unknown_file() {
    let path = test_file("crates/lib/files/mimetypes/Cargo.toml");

    assert_eq!(get_mimetype_for_file_or_default(&path).unwrap(), "application/octet-stream");
  }

  #[test]
  fn test_missing_file_is_an_error() {
    let path = test_file("test_data/does_not_exist.bin");

    assert!(get_mimetype_for_file(&path).is_err());
  }
}
