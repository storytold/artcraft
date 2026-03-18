use crate::legacy::typified_paths::public::public_path::PublicPath;
use crate::util::hashed_directory_path_long_string::hashed_directory_path_long_string;

// TODO: Generate these from a macro.

// TODO: Use a central path registry for quick reference
const DIRECTORY: &str = "/voice_conversion";

/// Directory for voice conversion results.
/// Each result gets its own directory so that we can store the result
/// alongside metadata and re-processed derivatives.
#[derive(Clone)]
pub struct VoiceConversionResultDirectory {
  object_hash: String,
  directory: String,
}

impl PublicPath for VoiceConversionResultDirectory {}

impl VoiceConversionResultDirectory {

  pub fn from_public_bucket_directory_hash(object_hash: &str) -> Self {
    // TODO: Path construction could be cleaner.
    let middle = hashed_directory_path_long_string(object_hash);
    let directory = format!("{}/{}{}", DIRECTORY, middle, object_hash);
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
  use crate::legacy::typified_paths::public::voice_conversion_results::bucket_directory::VoiceConversionResultDirectory;

  #[test]
  pub fn get_directory_path_str() {
    let directory = VoiceConversionResultDirectory::from_public_bucket_directory_hash("abcdefghijk");
    assert_eq!(directory.get_directory_path_str(), "/voice_conversion/a/b/c/d/e/abcdefghijk");
  }

  #[test]
  pub fn get_directory_path_str_short_name() {
    let directory = VoiceConversionResultDirectory::from_public_bucket_directory_hash("foo");
    assert_eq!(directory.get_directory_path_str(), "/voice_conversion/f/o/foo");
  }

  #[test]
  pub fn get_object_hash() {
    let hash = "abcdefghijk";
    let directory = VoiceConversionResultDirectory::from_public_bucket_directory_hash(hash);
    assert_eq!(directory.get_object_hash(), hash);
  }
}
