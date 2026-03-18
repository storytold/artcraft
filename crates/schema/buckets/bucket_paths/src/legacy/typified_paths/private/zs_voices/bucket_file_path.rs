use std::path::PathBuf;

use crockford::crockford_entropy_lower;

use crate::legacy::typified_paths::private::private_path::PrivatePath;
use crate::legacy::typified_paths::private::zs_voices::bucket_directory::{ModelCategory, ModelType, ZeroShotVoiceEmbeddingBucketDirectory};

// TODO: Generate these from a macro.

/// The original user upload file.
/// It may have derivative files (down samples, crops, etc.) that live alongside it.
#[derive(Clone)]
pub struct ZeroShotVoiceEmbeddingBucketPath {
  directory: ZeroShotVoiceEmbeddingBucketDirectory,

  filename: String,
  full_object_path: String,

  model_category: ModelCategory,
  model_type: ModelType,
  model_version: u64,
}

impl PrivatePath for ZeroShotVoiceEmbeddingBucketPath {}

impl ZeroShotVoiceEmbeddingBucketPath {

  pub fn generate_new(model_category: ModelCategory, model_type: ModelType, model_version: u64) -> Self {
    let entropy = crockford_entropy_lower(32);
    Self::from_object_hash(&entropy, model_category, model_type, model_version)
  }

  pub fn from_object_hash(hash: &str, model_category: ModelCategory, model_type: ModelType, model_version: u64) -> Self {
    // TODO: Path construction could be cleaner.
    let directory = ZeroShotVoiceEmbeddingBucketDirectory::from_object_hash(model_category, model_type, hash);

    let filename = format!("{}_{}_{}", model_type.to_str(), hash, model_version);

    let full_object_path = format!("{}/{}", directory.get_directory_path_str(), filename);

    Self {
      directory,
      filename,
      full_object_path,
      model_category,
      model_type,
      model_version,
    }
  }

  pub fn get_full_object_path_str(&self) -> &str {
    &self.full_object_path
  }

  pub fn to_full_object_pathbuf(&self) -> PathBuf {
    PathBuf::from(&self.full_object_path)
  }

  pub fn get_directory(&self) -> &ZeroShotVoiceEmbeddingBucketDirectory {
    &self.directory
  }

  pub fn get_object_hash(&self) -> &str {
    &self.directory.get_object_hash()
  }

  pub fn get_basename(&self) -> &str {
    &self.filename
  }
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  mod with_prefix_and_extension {
    use crate::legacy::typified_paths::private::zs_voices::bucket_directory::ModelCategory;
    use crate::legacy::typified_paths::private::zs_voices::bucket_file_path::{ModelType, ZeroShotVoiceEmbeddingBucketPath};

    #[test]
    pub fn generate_new_entropy() {
      let file = ZeroShotVoiceEmbeddingBucketPath::generate_new(ModelCategory::Tts, ModelType::VallEx, 0);
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_directory().get_object_hash().len(), 32);
    }

    #[test]
    pub fn get_full_object_path_str() {
      let file = ZeroShotVoiceEmbeddingBucketPath::from_object_hash("abcdefghijk", ModelCategory::Tts, ModelType::VallEx, 0);
      assert_eq!(file.get_full_object_path_str(), "/user/zs_embeddings/tts/vallex/a/b/c/d/e/abcdefghijk/vallex_abcdefghijk_0");
      assert_eq!(file.get_basename(), "vallex_abcdefghijk_0");
    }
  }

  mod without_prefix_and_extension {
    use crate::legacy::typified_paths::private::zs_voices::bucket_directory::ModelCategory;
    use crate::legacy::typified_paths::private::zs_voices::bucket_file_path::{ModelType, ZeroShotVoiceEmbeddingBucketPath};

    use super::*;

    #[test]
    pub fn generate_new_entropy() {
      let file = ZeroShotVoiceEmbeddingBucketPath::generate_new(ModelCategory::Vc, ModelType::VallEx, 123);
      assert_eq!(file.get_object_hash().len(), 32);
      assert_eq!(file.get_directory().get_object_hash().len(), 32);
    }

    #[test]
    pub fn from_object_hash_tts_vallex_version() {
      let file = ZeroShotVoiceEmbeddingBucketPath::from_object_hash("abcdefghijk", ModelCategory::Tts, ModelType::VallEx, 123);
      assert_eq!(file.get_full_object_path_str(), "/user/zs_embeddings/tts/vallex/a/b/c/d/e/abcdefghijk/vallex_abcdefghijk_123");
      assert_eq!(file.to_full_object_pathbuf(), PathBuf::from("/user/zs_embeddings/tts/vallex/a/b/c/d/e/abcdefghijk/vallex_abcdefghijk_123"));
      assert_eq!(file.get_basename(), "vallex_abcdefghijk_123");
    }

    #[test]
    pub fn from_object_hash_vc_vallex_version() {
      let file = ZeroShotVoiceEmbeddingBucketPath::from_object_hash("abcdefghijk", ModelCategory::Vc, ModelType::VallEx, 0);
      assert_eq!(file.get_full_object_path_str(), "/user/zs_embeddings/vc/vallex/a/b/c/d/e/abcdefghijk/vallex_abcdefghijk_0");
      assert_eq!(file.to_full_object_pathbuf(), PathBuf::from("/user/zs_embeddings/vc/vallex/a/b/c/d/e/abcdefghijk/vallex_abcdefghijk_0"));
      assert_eq!(file.get_basename(), "vallex_abcdefghijk_0");
    }

    #[test]
    pub fn get_full_object_path_str_starts_with_directory() {
      let file = ZeroShotVoiceEmbeddingBucketPath::generate_new(ModelCategory::Vc, ModelType::VallEx, 123);
      let full_path = file.get_full_object_path_str();
      assert!(full_path.starts_with(file.get_directory().get_directory_path_str()))
    }

    #[test]
    pub fn get_object_hash() {
      let hash = "abcdefghijk";
      let file = ZeroShotVoiceEmbeddingBucketPath::from_object_hash(hash, ModelCategory::Tts, ModelType::VallEx, 1);
      assert_eq!(file.get_object_hash(), hash);
    }
  }
}
