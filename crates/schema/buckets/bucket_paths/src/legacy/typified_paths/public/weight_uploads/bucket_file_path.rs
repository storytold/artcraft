use std::path::PathBuf;

use crockford::crockford_entropy_lower;

use crate::legacy::typified_paths::public::public_path::PublicPath;
use crate::legacy::typified_paths::public::weight_uploads::bucket_directory::WeightUploadDirectory;

const ORIGINAL_FILE_BASENAME : &str = "original_upload.bin";

#[derive(Clone)]
pub struct WeightUploadOriginalFilePath {
  directory: WeightUploadDirectory,
  full_object_path: String,
}

impl PublicPath for WeightUploadOriginalFilePath {}

impl WeightUploadOriginalFilePath {

  pub fn generate_new() -> Self {
    let entropy = crockford_entropy_lower(32);
    Self::from_object_hash(&entropy)
  }

  pub fn from_object_hash(hash: &str) -> Self {
    // TODO: Path construction could be cleaner.
    let directory = WeightUploadDirectory::from_object_hash(hash);
    let full_object_path = format!("{}/{}", directory.get_directory_path_str(), ORIGINAL_FILE_BASENAME);
    Self {
      directory,
      full_object_path,
    }
  }

  pub fn get_full_object_path_str(&self) -> &str {
    &self.full_object_path
  }

  pub fn to_full_object_pathbuf(&self) -> PathBuf {
    PathBuf::from(&self.full_object_path)
  }

  pub fn get_directory(&self) -> &WeightUploadDirectory {
    &self.directory
  }

  pub fn get_object_hash(&self) -> &str {
    &self.directory.get_object_hash()
  }

  pub fn get_basename() -> &'static str {
    ORIGINAL_FILE_BASENAME
  }
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::legacy::typified_paths::public::weight_uploads::bucket_file_path::WeightUploadOriginalFilePath;

  #[test]
  pub fn generate_new_entropy() {
    let file = WeightUploadOriginalFilePath::generate_new();
    assert_eq!(file.get_object_hash().len(), 32);
    assert_eq!(file.get_directory().get_object_hash().len(), 32);
  }

  #[test]
  pub fn get_full_object_path_str() {
    let file = WeightUploadOriginalFilePath::from_object_hash("abcdefghijk");
    assert_eq!(file.get_full_object_path_str(), "/weight_upload/a/b/c/d/e/abcdefghijk/original_upload.bin");
  }

  #[test]
  pub fn to_full_object_pathbuf() {
    let file = WeightUploadOriginalFilePath::from_object_hash("abcdefghijk");
    assert_eq!(file.to_full_object_pathbuf(), PathBuf::from("/weight_upload/a/b/c/d/e/abcdefghijk/original_upload.bin"));
  }

  #[test]
  pub fn get_full_object_path_str_short_name() {
    let file = WeightUploadOriginalFilePath::from_object_hash("foo");
    assert_eq!(file.get_full_object_path_str(), "/weight_upload/f/o/foo/original_upload.bin");
  }

  #[test]
  pub fn get_full_object_path_str_starts_with_directory() {
    let file = WeightUploadOriginalFilePath::from_object_hash("abcdefghijk");
    let full_path = file.get_full_object_path_str();
    assert!(full_path.starts_with(file.get_directory().get_directory_path_str()))
  }

  #[test]
  pub fn get_object_hash() {
    let hash = "abcdefghijk";
    let file = WeightUploadOriginalFilePath::from_object_hash(hash);
    assert_eq!(file.get_object_hash(), hash);
  }
}
