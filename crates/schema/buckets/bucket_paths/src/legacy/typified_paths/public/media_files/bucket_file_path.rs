use std::path::PathBuf;

use crockford::crockford_entropy_lower;

use crate::legacy::typified_paths::public::media_files::bucket_directory::MediaFileBucketDirectory;
use crate::legacy::typified_paths::public::public_path::PublicPath;

const ORIGINAL_FILE_BASENAME : &str = "file.bin";

// TODO: Generate these from a macro.

/// The original user upload file.
/// It may have derivative files (down samples, crops, etc.) that live alongside it.
#[derive(Clone)]
pub struct MediaFileBucketPath {
  directory: MediaFileBucketDirectory,

  filename: String,
  full_object_path: String,

  optional_prefix: Option<String>,
  /// NB: Extension contains the leading period, eg. ".mp4"
  optional_extension: Option<String>,
}

impl PublicPath for MediaFileBucketPath {}

impl MediaFileBucketPath {

  /// NB: The `optional_extension` needs to include a "." (period) if you want it in the file.
  pub fn generate_new(optional_prefix: Option<&str>, optional_extension: Option<&str>) -> Self {
    let entropy = crockford_entropy_lower(32);
    Self::from_object_hash(&entropy, optional_prefix, optional_extension)
  }

  /// NB: The `optional_extension` needs to include a "." (period) if you want it in the file.
  pub fn from_object_hash(hash: &str, optional_prefix: Option<&str>, optional_extension: Option<&str>) -> Self {
    // TODO: Path construction could be cleaner.
    let directory = MediaFileBucketDirectory::from_object_hash(hash);

    let filename = match (optional_prefix, optional_extension) {
      (None, None) => ORIGINAL_FILE_BASENAME.to_string(),
      (None, Some(ext)) => format!("{}{}", hash, ext),
      (Some(pre), None) => format!("{}{}", pre, hash),
      (Some(pre), Some(ext)) => format!("{}{}{}", pre, hash, ext),
    };

    let full_object_path = format!("{}/{}", directory.get_directory_path_str(), filename);

    Self {
      directory,
      filename,
      full_object_path,
      optional_prefix: optional_prefix.map(|p| p.to_string()),
      optional_extension: optional_extension.map(|e| e.to_string()),
    }
  }

  pub fn get_full_object_path_str(&self) -> &str {
    &self.full_object_path
  }

  pub fn to_full_object_pathbuf(&self) -> PathBuf {
    PathBuf::from(&self.full_object_path)
  }

  pub fn get_directory(&self) -> &MediaFileBucketDirectory {
    &self.directory
  }

  pub fn get_object_hash(&self) -> &str {
    &self.directory.get_object_hash()
  }

  pub fn get_basename(&self) -> &str {
    &self.filename
  }

  pub fn get_optional_prefix(&self) -> Option<&str> {
    self.optional_prefix.as_deref()
  }

  pub fn get_optional_extension(&self) -> Option<&str> {
    self.optional_extension.as_deref()
  }
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;

  mod with_prefix_and_extension {
    use super::*;

    #[test]
    pub fn generate_new_entropy() {
      let file = MediaFileBucketPath::generate_new(Some("pre_"), Some(".mp4"));
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_directory().get_object_hash().len(), 32);
    }

    #[test]
    pub fn get_full_object_path_str() {
      let file = MediaFileBucketPath::from_object_hash("abcdefghijk", Some("pre_"), Some(".mp4"));
      assert_eq!(file.get_full_object_path_str(), "/media/a/b/c/d/e/abcdefghijk/pre_abcdefghijk.mp4");
      assert_eq!(file.get_basename(), "pre_abcdefghijk.mp4");
    }
  }

  mod without_prefix_and_extension {
    use super::*;

    #[test]
    pub fn generate_new_entropy() {
      let file = MediaFileBucketPath::generate_new(None, None);
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_directory().get_object_hash().len(), 32);
    }

    #[test]
    pub fn get_full_object_path_str() {
      let file = MediaFileBucketPath::from_object_hash("abcdefghijk", None, None);
      assert_eq!(file.get_full_object_path_str(), "/media/a/b/c/d/e/abcdefghijk/file.bin");
    }

    #[test]
    pub fn to_full_object_pathbuf() {
      let file = MediaFileBucketPath::from_object_hash("abcdefghijk", None, None);
      assert_eq!(file.to_full_object_pathbuf(), PathBuf::from("/media/a/b/c/d/e/abcdefghijk/file.bin"));
    }

    #[test]
    pub fn get_full_object_path_str_short_name() {
      let file = MediaFileBucketPath::from_object_hash("foo", None, None);
      assert_eq!(file.get_full_object_path_str(), "/media/f/o/foo/file.bin");
    }

    #[test]
    pub fn get_full_object_path_str_starts_with_directory() {
      let file = MediaFileBucketPath::from_object_hash("abcdefghijk", None, None);
      let full_path = file.get_full_object_path_str();
      assert!(full_path.starts_with(file.get_directory().get_directory_path_str()))
    }

    #[test]
    pub fn get_object_hash() {
      let hash = "abcdefghijk";
      let file = MediaFileBucketPath::from_object_hash(hash, None, None);
      assert_eq!(file.get_object_hash(), hash);
    }
  }
}
