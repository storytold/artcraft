use std::path::Path;

pub fn file_exists<P: AsRef<Path>>(path: P) -> bool {
  let path_ref = path.as_ref();
  if !path_ref.exists() {
    return false;
  }
  if !path_ref.is_file() {
    return false;
  }
  true
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::file_exists::file_exists;

  #[test]
  fn test_file_exists() {
    assert_eq!(true, file_exists("../../../../test_data/audio/flac/zelda_ocarina_small_item.flac"));
    assert_eq!(true, file_exists(PathBuf::from("../../../../test_data/audio/flac/zelda_ocarina_small_item.flac")));
  }

  #[test]
  fn test_file_does_not_exist() {
    assert_eq!(false, file_exists(""));
    assert_eq!(false, file_exists("   "));
    assert_eq!(false, file_exists("./")); // Current directory is not a file
    assert_eq!(false, file_exists("foo"));
    assert_eq!(false, file_exists("foo/bar/baz"));
    assert_eq!(false, file_exists("/foo/bar/baz"));

    assert_eq!(false, file_exists(PathBuf::from("")));
    assert_eq!(false, file_exists(PathBuf::from("   ")));
    assert_eq!(false, file_exists(PathBuf::from("./")));
    assert_eq!(false, file_exists(PathBuf::from("foo/bar/baz")));
  }
}