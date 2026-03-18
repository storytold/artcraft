use std::path::PathBuf;

use crockford::crockford_entropy_lower;

use crate::legacy::typified_paths::public::public_path::PublicPath;
use crate::legacy::typified_paths::public::voice_conversion_results::bucket_directory::VoiceConversionResultDirectory;

const ORIGINAL_FILE_PREFIX : &str = "fakeyou_";
const ORIGINAL_FILE_SUFFIX : &str = ".wav";

// TODO: Generate these from a macro.

/// The original user upload file.
/// It may have derivative files (down samples, crops, etc.) that live alongside it.
#[derive(Clone)]
pub struct VoiceConversionResultOriginalFilePath {
  directory: VoiceConversionResultDirectory,
  basename: String,
  full_object_path: String,
}

impl PublicPath for VoiceConversionResultOriginalFilePath {}

impl VoiceConversionResultOriginalFilePath {

  pub fn generate_new() -> Self {
    let entropy = crockford_entropy_lower(32);
    Self::from_object_hash(&entropy)
  }

  pub fn from_object_hash(hash: &str) -> Self {
    // TODO: Path construction could be cleaner.
    let directory = VoiceConversionResultDirectory::from_public_bucket_directory_hash(hash);
    let basename = format!("{}{}{}", ORIGINAL_FILE_PREFIX, hash, ORIGINAL_FILE_SUFFIX);
    let full_object_path = format!("{}/{}{}{}", directory.get_directory_path_str(), ORIGINAL_FILE_PREFIX, hash, ORIGINAL_FILE_SUFFIX);
    Self {
      directory,
      basename,
      full_object_path,
    }
  }

  pub fn get_full_object_path_str(&self) -> &str {
    &self.full_object_path
  }

  pub fn to_full_object_pathbuf(&self) -> PathBuf {
    PathBuf::from(&self.full_object_path)
  }

  pub fn get_directory(&self) -> &VoiceConversionResultDirectory {
    &self.directory
  }

  pub fn get_object_hash(&self) -> &str {
    &self.directory.get_object_hash()
  }

  pub fn get_basename(&self) -> &str {
    &self.basename
  }
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::legacy::typified_paths::public::voice_conversion_results::bucket_file_path::VoiceConversionResultOriginalFilePath;

  #[test]
  pub fn generate_new_entropy() {
    let file = VoiceConversionResultOriginalFilePath::generate_new();
    assert_eq!(file.get_object_hash().len(), 32);
    assert_eq!(file.get_directory().get_object_hash().len(), 32);
  }

  #[test]
  pub fn get_full_object_path_str() {
    let file = VoiceConversionResultOriginalFilePath::from_object_hash("abcdefghijk");
    assert_eq!(file.get_full_object_path_str(), "/voice_conversion/a/b/c/d/e/abcdefghijk/fakeyou_abcdefghijk.wav");
  }

  #[test]
  pub fn to_full_object_pathbuf() {
    let file = VoiceConversionResultOriginalFilePath::from_object_hash("abcdefghijk");
    assert_eq!(file.to_full_object_pathbuf(), PathBuf::from("/voice_conversion/a/b/c/d/e/abcdefghijk/fakeyou_abcdefghijk.wav"));
  }

  #[test]
  pub fn get_full_object_path_str_short_name() {
    let file = VoiceConversionResultOriginalFilePath::from_object_hash("foo");
    assert_eq!(file.get_full_object_path_str(), "/voice_conversion/f/o/foo/fakeyou_foo.wav");
  }

  #[test]
  pub fn get_full_object_path_str_starts_with_directory() {
    let file = VoiceConversionResultOriginalFilePath::from_object_hash("abcdefghijk");
    let full_path = file.get_full_object_path_str();
    assert!(full_path.starts_with(file.get_directory().get_directory_path_str()))
  }

  #[test]
  pub fn get_object_hash() {
    let hash = "abcdefghijk";
    let file = VoiceConversionResultOriginalFilePath::from_object_hash(hash);
    assert_eq!(file.get_object_hash(), hash);
  }
}
