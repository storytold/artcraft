
/// Create a cloud object store directory structure that can be easily traversed without
/// too many items living in a single directory.
///
/// With a million items, each directory will have ~244 items.
/// With a billion items, each directory will have ~244,140 items (impractical at this scale).
///
#[deprecated(note = "Use hashed_directory_path_long_string instead! (This function is only used by BucketPathUnifier, which should also die)")]
pub fn hashed_directory_path_short_string(file_hash: &str) -> String {
  match file_hash.len() {
    0 | 1 => "".to_string(),
    2 => format!("{}/", &file_hash[0..1]),
    3 => format!("{}/{}/", &file_hash[0..1], &file_hash[1..2]),
    _ => format!("{}/{}/{}/", &file_hash[0..1], &file_hash[1..2], &file_hash[2..3]),
  }
}

#[cfg(test)]
mod tests {
  use crate::legacy::old_bespoke_paths::hashed_directory_path_short_string::hashed_directory_path_short_string;

  #[test]
  fn test_length_zero() {
    assert_eq!(hashed_directory_path_short_string(""), "".to_string());
  }

  #[test]
  fn test_length_one() {
    assert_eq!(hashed_directory_path_short_string("a"), "".to_string());
  }

  #[test]
  fn test_length_two() {
    assert_eq!(hashed_directory_path_short_string("ab"), "a/".to_string());
  }

  #[test]
  fn test_length_three() {
    assert_eq!(hashed_directory_path_short_string("abc"), "a/b/".to_string());
  }

  #[test]
  fn test_length_four() {
    assert_eq!(hashed_directory_path_short_string("abcd"), "a/b/c/".to_string());
  }

  #[test]
  fn test_length_five() {
    assert_eq!(hashed_directory_path_short_string("abcde"), "a/b/c/".to_string());
  }

  #[test]
  fn test_length_ten() {
    assert_eq!(hashed_directory_path_short_string("abcdefghij"), "a/b/c/".to_string());
  }
}
