use crockford::crockford_entropy_lower;
// TODO Thoughts NOTE:
// I am wondering if it be easier if we just had a single struct and impl to handle downloads from public and private buckets.
// essentially, the only difference is the prefix and file postfix and the path of where the file goes and the path will be constructed from there.
// then you can tie in the downloader as a single object that can be used for both public and private buckets.

use crate::legacy::typified_paths::public::public_path::PublicPath;
use crate::util::hashed_directory_path_long_string::hashed_directory_path_long_string;

const WEIGHT_UPLOAD_DIRECTORY : &str = "/weight_upload";

/// Directory for user media uploads.
/// Each uploaded file gets its own directory so that we can store the original
/// file alongside re-processed derivatives.
#[derive(Clone)]
pub struct WeightUploadDirectory {
  object_hash: String,
  directory: String,
}

impl PublicPath for WeightUploadDirectory {}

impl WeightUploadDirectory {

  pub fn generate_new() -> Self {
    let entropy = crockford_entropy_lower(32);
    Self::from_object_hash(&entropy)
  }

  pub fn from_object_hash(object_hash: &str) -> Self {
    // TODO: Path construction could be cleaner.
    let middle = hashed_directory_path_long_string(object_hash);
    let directory = format!("{}/{}{}", WEIGHT_UPLOAD_DIRECTORY, middle, object_hash);
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
  use crate::legacy::typified_paths::public::weight_uploads::bucket_directory::WeightUploadDirectory;

  #[test]
  pub fn generate_new_entropy() {
    let directory = WeightUploadDirectory::generate_new();
    assert_eq!(directory.get_object_hash().len(), 32);
  }

  #[test]
  pub fn get_directory_path_str() {
    let directory = WeightUploadDirectory::from_object_hash("abcdefghijk");
    assert_eq!(directory.get_directory_path_str(), "/weight_upload/a/b/c/d/e/abcdefghijk");
  }

  #[test]
  pub fn get_directory_path_str_short_name() {
    let directory = WeightUploadDirectory::from_object_hash("foo");
    assert_eq!(directory.get_directory_path_str(), "/weight_upload/f/o/foo");
  }

  #[test]
  pub fn get_object_hash() {
    let hash = "abcdefghijk";
    let directory = WeightUploadDirectory::from_object_hash(hash);
    assert_eq!(directory.get_object_hash(), hash);
  }
}
