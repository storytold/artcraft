use std::fmt;

/// A normalized object key for the bucket.
///
/// Leading slashes are stripped: S3/R2 treat a leading `/` as an empty leading
/// path segment, which silently produces surprising keys (e.g. `/foo.mp4`
/// becomes an object literally named `/foo.mp4`). Normalizing here keeps stored
/// keys consistent regardless of how callers format the name.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ObjectName(String);

impl ObjectName {
  /// Build a normalized object name from any string-like value.
  pub fn new(raw: impl AsRef<str>) -> Self {
    ObjectName(raw.as_ref().trim_start_matches('/').to_string())
  }

  /// The normalized key as a string slice.
  pub fn as_str(&self) -> &str {
    &self.0
  }
}

impl fmt::Display for ObjectName {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl AsRef<str> for ObjectName {
  fn as_ref(&self) -> &str {
    &self.0
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn strips_leading_slashes() {
    assert_eq!(ObjectName::new("/foo/bar.mp4").as_str(), "foo/bar.mp4");
    assert_eq!(ObjectName::new("///a").as_str(), "a");
    assert_eq!(ObjectName::new("already/clean.txt").as_str(), "already/clean.txt");
  }

  #[test]
  fn accepts_string_and_str() {
    assert_eq!(ObjectName::new(String::from("x.bin")).as_str(), "x.bin");
    assert_eq!(ObjectName::new("x.bin").as_str(), "x.bin");
  }
}
