use std::path::{Path, PathBuf};

use crate::path_to_string::path_to_string;

/// Concatenate filenames while preserving path information. Do not join paths as directories.
/// This contains no file normalizing logic, it's purely a concatenation.
///
///   eg. "foo" + "bar" results in "foobar" instead of the "foo/bar" that Path::join() returns.
///   eg. "/usr/bin" + "baz" results in "/usr/binbaz" instead of "/usr/bin/baz"
///
/// This is not efficient.
pub fn filename_concat<P: AsRef<Path>, Q: AsRef<Path>>(part_1: P, part_2: Q) -> String {
  let mut base = path_to_string(part_1);
  let suffix= path_to_string(part_2);
  base.push_str(&suffix);
  base
}

pub fn filename_concat_pathbuf<P: AsRef<Path>, Q: AsRef<Path>>(part_1: P, part_2: Q) -> PathBuf {
  PathBuf::from(filename_concat(part_1, part_2))
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::filename_concat::filename_concat;

  // Layout: Base, Suffix, Expected Result
  const TEST_CASES : [(&'static str, &'static str, &'static str); 11] = [
    // Absolute
    ("/", "foo", "/foo"),
    ("/usr/bin", "baz", "/usr/binbaz"),
    ("/usr/local", "/bin", "/usr/local/bin"),
    // Relative
    ("picture", ".jpg", "picture.jpg"),
    ("/", "..", "/.."),
    ("../", "..", "../.."),
    ("./", "bin", "./bin"),
    (".", "bar", ".bar"),
    // Misc
    ("", "", ""),
    ("/", "", "/"),
    ("", "/", "/"),
  ];

  #[test]
  fn pathbuf() {
    for (part_1, part_2, expected) in TEST_CASES.iter() {
      let test_part_1 = PathBuf::from(part_1);
      let test_part_2 = PathBuf::from(part_2);
      assert_eq!(filename_concat(test_part_1, test_part_2), expected.to_string());
    }
  }

  #[test]
  fn path() {
    for (part_1, part_2, expected) in TEST_CASES.iter() {
      let test_part_1 = PathBuf::from(part_1);
      let test_part_2 = PathBuf::from(part_2);

      assert_eq!(filename_concat(test_part_1.as_path(), test_part_2.as_path()),
                 expected.to_string());
    }
  }

  #[test]
  fn str() {
    for (part_1, part_2, expected) in TEST_CASES.iter() {
      let test_part_1 = *part_1;
      let test_part_2 = *part_2;
      assert_eq!(filename_concat(test_part_1, test_part_2), expected.to_string());
    }
  }

  #[test]
  fn mixed_type() {
    for (part_1, part_2, expected) in TEST_CASES.iter() {
      let test_part_1 = PathBuf::from(part_1);
      let test_part_2 = *part_2;
      assert_eq!(filename_concat(test_part_1, test_part_2), expected.to_string());
    }
  }
}
