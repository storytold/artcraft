use crockford::crockford_entropy_lower;

use crate::legacy::typified_paths::private::private_path::PrivatePath;
use crate::util::hashed_directory_path_long_string::hashed_directory_path_long_string;

// TODO: Generate these from a macro.

// TODO: Use a central path registry for quick reference
const DIRECTORY: &str = "/user/zs_embeddings";

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum ModelCategory {
  Tts,
  Vc,
}

impl ModelCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      ModelCategory::Tts => "tts",
      ModelCategory::Vc => "vc",
    }
  }
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum ModelType {
  VallEx,
  StyleTTS2,
}

impl ModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      ModelType::VallEx => "vallex",
      ModelType::StyleTTS2 => "styletts2",
    }
  }
}

/// Directory for zero shot voice embeddings
/// Each embedding gets its own directory so we can store new versions alongside the original.
#[derive(Clone)]
pub struct ZeroShotVoiceEmbeddingBucketDirectory {
  model_category: ModelCategory,
  model_type: ModelType,
  object_hash: String,
  directory: String,
}

impl PrivatePath for ZeroShotVoiceEmbeddingBucketDirectory {}

impl ZeroShotVoiceEmbeddingBucketDirectory {

  pub fn generate_new(model_category: ModelCategory, model_type: ModelType) -> Self {
    let entropy = crockford_entropy_lower(32);
    Self::from_object_hash(model_category, model_type, &entropy)
  }

  pub fn from_object_hash(model_category: ModelCategory, model_type: ModelType, object_hash: &str) -> Self {
    // TODO: Path construction could be cleaner.
    let subdirs = format!("{}/{}", model_category.to_str(), model_type.to_str());
    let middle = hashed_directory_path_long_string(object_hash);
    let directory = format!("{}/{}/{}{}", DIRECTORY, subdirs, middle, object_hash);
    Self {
      model_category,
      model_type,
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
  use crate::legacy::typified_paths::private::zs_voices::bucket_directory::{ModelCategory, ModelType, ZeroShotVoiceEmbeddingBucketDirectory};

  #[test]
  pub fn generate_new_entropy() {
    let directory = ZeroShotVoiceEmbeddingBucketDirectory::generate_new(ModelCategory::Tts, ModelType::VallEx);
    assert_eq!(directory.get_object_hash().len(), 32);
  }

  #[test]
  pub fn get_directory_path_str() {
    let directory = ZeroShotVoiceEmbeddingBucketDirectory::from_object_hash(ModelCategory::Tts, ModelType::VallEx, "abcdefghijk");
    assert_eq!(directory.get_directory_path_str(), "/user/zs_embeddings/tts/vallex/a/b/c/d/e/abcdefghijk");
  }

  #[test]
  pub fn get_directory_path_str_short_name() {
    let directory = ZeroShotVoiceEmbeddingBucketDirectory::from_object_hash(ModelCategory::Tts, ModelType::VallEx, "foo");
    assert_eq!(directory.get_directory_path_str(), "/user/zs_embeddings/tts/vallex/f/o/foo");
  }

  #[test]
  pub fn get_object_hash() {
    let hash = "abcdefghijk";
    let directory = ZeroShotVoiceEmbeddingBucketDirectory::from_object_hash(ModelCategory::Tts, ModelType::VallEx, hash);
    assert_eq!(directory.get_object_hash(), hash);
  }
}
