use std::path::Path;

/// Convert a path to a string without adding quotes or garbage.
pub fn path_to_string<P: AsRef<Path>>(path: P) -> String {
  path.as_ref().display().to_string()
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::path_to_string::path_to_string;

  const TEST_CASES : [&'static str; 9] = [
    // Absolute
    "/",
    "/usr/bin",
    // Relative
    "picture.jpg",
    "foo/bar/baz",
    "../",
    "./",
    ".",
    // Misc
    "",
    ".././../foo/.././bar",
  ];

  #[test]
  fn pathbuf() {
    for example in TEST_CASES.iter() {
      let test = PathBuf::from(example);
      assert_eq!(path_to_string(test), example.to_string());
    }
  }

  #[test]
  fn path() {
    for example in TEST_CASES.iter() {
      let path = PathBuf::from(example);
      let test = path.as_path();
      assert_eq!(path_to_string(test), example.to_string());
    }
  }

  #[test]
  fn str() {
    for example in TEST_CASES.iter() {
      let test = *example;
      assert_eq!(path_to_string(test), example.to_string());
    }
  }
}
