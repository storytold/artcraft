use std::path::PathBuf;

/// Represents a bucket path.
pub trait BucketPath {
  /// Return the rooted path of the object as a string
  fn to_rooted_string(&self) -> String;

  /// Return the rooted path of the object as a path
  fn to_rooted_path(&self) -> PathBuf;
}
