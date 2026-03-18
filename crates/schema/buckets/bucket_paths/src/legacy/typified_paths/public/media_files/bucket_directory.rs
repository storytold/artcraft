use crockford::crockford_entropy_lower;

use crate::legacy::typified_paths::public::public_path::PublicPath;
use crate::util::hashed_directory_path_long_string::hashed_directory_path_long_string;

// TODO: Generate these from a macro.
// TODO: Use a central path registry for quick reference
const MEDIA_FILE_DIRECTORY: &str = "/media";

/// Directory for user media uploads.
/// Each uploaded file gets its own directory so that we can store the original
/// file alongside re-processed derivatives.
#[derive(Clone, Debug)]
pub struct MediaFileBucketDirectory {
  object_hash: String,
  directory: String,
}

impl PublicPath for MediaFileBucketDirectory {}

impl MediaFileBucketDirectory {

  pub fn generate_new() -> Self {
    let entropy = crockford_entropy_lower(32);
    Self::from_object_hash(&entropy)
  }

  pub fn from_object_hash(object_hash: &str) -> Self {
    // TODO: Path construction could be cleaner.
    let middle = hashed_directory_path_long_string(object_hash);
    let directory = format!("{}/{}{}", MEDIA_FILE_DIRECTORY, middle, object_hash);
    Self {
      object_hash: object_hash.to_string(),
      directory,
    }
  }

  pub fn get_directory_path_str(&self) -> &str {
    &self.directory
  }

  pub fn get_object_hash(&self) -> &str {
    &self.object_hash
  }
}

#[cfg(test)]
mod tests {
  use crate::legacy::typified_paths::public::media_files::bucket_directory::MediaFileBucketDirectory;

  #[test]
  pub fn generate_new_entropy() {
    let directory = MediaFileBucketDirectory::generate_new();
    assert_eq!(directory.get_object_hash().len(), 32);
  }

  #[test]
  pub fn get_directory_path_str() {
    let directory = MediaFileBucketDirectory::from_object_hash("abcdefghijk");
    assert_eq!(directory.get_directory_path_str(), "/media/a/b/c/d/e/abcdefghijk");
  }

  #[test]
  pub fn get_directory_path_str_short_name() {
    let directory = MediaFileBucketDirectory::from_object_hash("foo");
    assert_eq!(directory.get_directory_path_str(), "/media/f/o/foo");
  }

  #[test]
  pub fn get_object_hash() {
    let hash = "abcdefghijk";
    let directory = MediaFileBucketDirectory::from_object_hash(hash);
    assert_eq!(directory.get_object_hash(), hash);
  }
}
