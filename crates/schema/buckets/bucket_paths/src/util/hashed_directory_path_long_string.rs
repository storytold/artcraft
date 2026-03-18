
/// Create a cloud object store directory structure that can be easily traversed without
/// too many items living in a single directory.
///
/// With a million items, each directory will have ~1 item.
/// With a billion items, each directory will have ~953 items (totally tractable).
///
pub (crate) fn hashed_directory_path_long_string(file_hash: &str) -> String {
  match file_hash.len() {
    0 | 1 => "".to_string(),
    2 => format!("{}/", &file_hash[0..1]),
    3 => format!("{}/{}/", &file_hash[0..1], &file_hash[1..2]),
    4 => format!("{}/{}/{}/", &file_hash[0..1], &file_hash[1..2], &file_hash[2..3]),
    5 => format!("{}/{}/{}/{}/", &file_hash[0..1], &file_hash[1..2], &file_hash[2..3], &file_hash[3..4]),
    _ => format!("{}/{}/{}/{}/{}/", &file_hash[0..1], &file_hash[1..2], &file_hash[2..3], &file_hash[3..4], &file_hash[4..5]),
  }
}

#[cfg(test)]
mod tests {
  use crate::util::hashed_directory_path_long_string::hashed_directory_path_long_string;

  #[test]
  fn test_length_zero() {
    assert_eq!(hashed_directory_path_long_string(""), "".to_string());
  }

  #[test]
  fn test_length_one() {
    assert_eq!(hashed_directory_path_long_string("a"), "".to_string());
  }

  #[test]
  fn test_length_two() {
    assert_eq!(hashed_directory_path_long_string("ab"), "a/".to_string());
  }

  #[test]
  fn test_length_three() {
    assert_eq!(hashed_directory_path_long_string("abc"), "a/b/".to_string());
  }

  #[test]
  fn test_length_four() {
    assert_eq!(hashed_directory_path_long_string("abcd"), "a/b/c/".to_string());
  }

  #[test]
  fn test_length_five() {
    assert_eq!(hashed_directory_path_long_string("abcde"), "a/b/c/d/".to_string());
  }

  #[test]
  fn test_length_six() {
    assert_eq!(hashed_directory_path_long_string("abcdef"), "a/b/c/d/e/".to_string());
  }

  #[test]
  fn test_length_seven() {
    assert_eq!(hashed_directory_path_long_string("abcdefg"), "a/b/c/d/e/".to_string());
  }

  #[test]
  fn test_length_ten() {
    assert_eq!(hashed_directory_path_long_string("abcdefghij"), "a/b/c/d/e/".to_string());
  }
}
