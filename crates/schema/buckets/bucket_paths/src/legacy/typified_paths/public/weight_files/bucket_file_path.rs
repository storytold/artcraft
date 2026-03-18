use std::path::PathBuf;

use crockford::crockford_entropy_lower;
use crate::legacy::typified_paths::public::public_path::PublicPath;

const ORIGINAL_FILE_BASENAME : &str = "file.bin";

// TODO: Generate these from a macro.
use crate::legacy::typified_paths::public::weight_files::bucket_directory::WeightFileBucketDirectory;

/// The original user upload file.
/// It may have derivative files (down samples, crops, etc.) that live alongside it.
#[derive(Clone)]
pub struct WeightFileBucketPath {
  directory: WeightFileBucketDirectory,

  filename: String,
  full_object_path: String,

  optional_prefix: Option<String>,
  /// NB: Extension contains the leading period, eg. ".mp4"
  optional_extension: Option<String>,
}

impl PublicPath for WeightFileBucketPath {}

impl WeightFileBucketPath {

  // TODO(bt,2024-01-14): This is temporary standardization. Clean this up.
  pub fn generate_for_tt2_model() -> Self {
    Self::generate_new(Some("tt2_"), Some(".pt"))
  }

  // TODO(bt,2023-12-19): This is temporary standardization. Clean this up.
  pub fn generate_for_svc_model() -> Self {
    Self::generate_new(Some("svc_"), Some(".pt"))
  }

  // TODO(bt,2023-12-19): This is temporary standardization. Clean this up.
  pub fn generate_for_rvc_model() -> Self {
    Self::generate_new(Some("rvc_"), Some(".pt"))
  }

  // TODO(bt,2024-01-15): This is temporary standardization. Clean this up.
  pub fn tt2_model_file_from_object_hash(hash: &str) -> Self {
    Self::from_object_hash(hash, Some("tt2_"), Some(".pt"))
  }

  // TODO(bt,2023-12-19): This is temporary standardization. Clean this up.
  pub fn svc_model_file_from_object_hash(hash: &str) -> Self {
    Self::from_object_hash(hash, Some("svc_"), Some(".pt"))
  }

  // TODO(bt,2023-12-19): This is temporary standardization. Clean this up.
  pub fn rvc_model_file_from_object_hash(hash: &str) -> Self {
    Self::from_object_hash(hash, Some("rvc_"), Some(".pt"))
  }

  // TODO(bt,2023-12-19): This is temporary standardization. Clean this up.
  pub fn rvc_index_file_from_object_hash(hash: &str) -> Self {
    Self::from_object_hash(hash, Some("rvc_"), Some(".index"))
  }

  pub fn generate_new(optional_prefix: Option<&str>, optional_extension: Option<&str>) -> Self {
    let entropy = crockford_entropy_lower(32);
    Self::from_object_hash(&entropy, optional_prefix, optional_extension)
  }

  pub fn from_object_hash(hash: &str, optional_prefix: Option<&str>, optional_extension: Option<&str>) -> Self {
    // TODO: Path construction could be cleaner.
    let directory = WeightFileBucketDirectory::from_object_hash(hash);

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

  pub fn get_directory(&self) -> &WeightFileBucketDirectory {
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

  use crate::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
  mod with_prefix_and_extension {
    use super::*;

    #[test]
    pub fn generate_new_entropy() {
      let file = WeightFileBucketPath::generate_new(Some("pre_"), Some(".mp4"));
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_directory().get_object_hash().len(), 32);
    }

    #[test]
    pub fn get_full_object_path_str() {
      let file = WeightFileBucketPath::from_object_hash("abcdefghijk", Some("pre_"), Some(".mp4"));
      assert_eq!(file.get_full_object_path_str(), "/weights/a/b/c/d/e/abcdefghijk/pre_abcdefghijk.mp4");
      assert_eq!(file.get_basename(), "pre_abcdefghijk.mp4");
    }

    #[test]
    pub fn generate_for_rvc_model() {
      let file = WeightFileBucketPath::generate_for_rvc_model();
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_directory().get_object_hash().len(), 32);
      assert_eq!(file.get_optional_prefix(), Some("rvc_"));
      assert_eq!(file.get_optional_extension(), Some(".pt"));
      assert!(file.get_basename().starts_with("rvc_"));
      assert!(file.get_basename().ends_with(".pt"));
    }

    #[test]
    pub fn generate_for_svc_model() {
      let file = WeightFileBucketPath::generate_for_svc_model();
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_directory().get_object_hash().len(), 32);
      assert_eq!(file.get_optional_prefix(), Some("svc_"));
      assert_eq!(file.get_optional_extension(), Some(".pt"));
      assert!(file.get_basename().starts_with("svc_"));
      assert!(file.get_basename().ends_with(".pt"));
    }

    #[test]
    pub fn svc_model_file_from_object_hash() {
      let file = WeightFileBucketPath::svc_model_file_from_object_hash("hashed");
      assert_eq!(file.get_full_object_path_str(), "/weights/h/a/s/h/e/hashed/svc_hashed.pt");
      assert_eq!(file.get_basename(), "svc_hashed.pt");
    }

    #[test]
    pub fn rvc_model_file_from_object_hash() {
      let file = WeightFileBucketPath::rvc_model_file_from_object_hash("hashed");
      assert_eq!(file.get_full_object_path_str(), "/weights/h/a/s/h/e/hashed/rvc_hashed.pt");
      assert_eq!(file.get_basename(), "rvc_hashed.pt");
    }

    #[test]
    pub fn rvc_index_file_from_object_hash() {
      let file = WeightFileBucketPath::rvc_index_file_from_object_hash("hashed");
      assert_eq!(file.get_full_object_path_str(), "/weights/h/a/s/h/e/hashed/rvc_hashed.index");
      assert_eq!(file.get_basename(), "rvc_hashed.index");
    }
  }

  mod without_prefix_and_extension {
    use super::*;

    #[test]
    pub fn generate_new_entropy() {
      let file = WeightFileBucketPath::generate_new(None, None);
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_directory().get_object_hash().len(), 32);
    }

    #[test]
    pub fn get_full_object_path_str() {
      let file = WeightFileBucketPath::from_object_hash("abcdefghijk", None, None);
      assert_eq!(file.get_full_object_path_str(), "/weights/a/b/c/d/e/abcdefghijk/file.bin");
    }

    #[test]
    pub fn to_full_object_pathbuf() {
      let file = WeightFileBucketPath::from_object_hash("abcdefghijk", None, None);
      assert_eq!(file.to_full_object_pathbuf(), PathBuf::from("/weights/a/b/c/d/e/abcdefghijk/file.bin"));
    }

    #[test]
    pub fn get_full_object_path_str_short_name() {
      let file = WeightFileBucketPath::from_object_hash("foo", None, None);
      assert_eq!(file.get_full_object_path_str(), "/weights/f/o/foo/file.bin");
    }

    #[test]
    pub fn get_full_object_path_str_starts_with_directory() {
      let file = WeightFileBucketPath::from_object_hash("abcdefghijk", None, None);
      let full_path = file.get_full_object_path_str();
      assert!(full_path.starts_with(file.get_directory().get_directory_path_str()))
    }

    #[test]
    pub fn get_object_hash() {
      let hash = "abcdefghijk";
      let file = WeightFileBucketPath::from_object_hash(hash, None, None);
      assert_eq!(file.get_object_hash(), hash);
    }
  }
}