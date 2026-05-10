use std::error::Error;
use std::fmt::Display;
use std::path::Path;

#[derive(Clone)]
pub struct ApiKeyData(String);

impl ApiKeyData {
  pub fn from_str(s: &str) -> Self {
    Self(s.trim().to_string())
  }

  pub fn as_str(&self) -> &str {
    self.0.as_str()
  }

  pub fn load_from_file<P: AsRef<Path>>(file_path: P) -> Result<Self, ApiKeyDataError> {
    let contents = std::fs::read_to_string(file_path)
      .map_err(ApiKeyDataError::IoError)?;
    Ok(Self(contents.trim().to_string()))
  }

  pub fn save_to_file<P: AsRef<Path>>(&self, file_path: P) -> Result<(), ApiKeyDataError> {
    std::fs::write(file_path, self.0.trim())
      .map_err(ApiKeyDataError::IoError)?;
    Ok(())
  }
}

#[derive(Debug)]
pub enum ApiKeyDataError {
  IoError(std::io::Error),
}

impl Error for ApiKeyDataError {
  fn source(&self) -> Option<&(dyn Error + 'static)> {
    match self {
      ApiKeyDataError::IoError(e) => Some(e),
    }
  }
}

impl Display for ApiKeyDataError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      ApiKeyDataError::IoError(e) => write!(f, "IO error: {}", e),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::NamedTempFile;
  use std::io::Write;

  #[test]
  fn load_trims_whitespace() {
    let mut file = NamedTempFile::new().unwrap();
    write!(file, "  sk-abc123  \n").unwrap();

    let data = ApiKeyData::load_from_file(file.path()).unwrap();
    assert_eq!(data.as_str(), "sk-abc123");
  }

  #[test]
  fn load_trims_newlines() {
    let mut file = NamedTempFile::new().unwrap();
    write!(file, "\nmy_secret_key\n\n").unwrap();

    let data = ApiKeyData::load_from_file(file.path()).unwrap();
    assert_eq!(data.as_str(), "my_secret_key");
  }

  #[test]
  fn save_trims_whitespace() {
    let file = NamedTempFile::new().unwrap();
    let data = ApiKeyData::from_str("  sk-padded  ");
    data.save_to_file(file.path()).unwrap();

    let contents = std::fs::read_to_string(file.path()).unwrap();
    assert_eq!(contents, "sk-padded");
  }

  #[test]
  fn round_trip() {
    let file = NamedTempFile::new().unwrap();
    let original = ApiKeyData::from_str("sk-round-trip-test-key");
    original.save_to_file(file.path()).unwrap();

    let loaded = ApiKeyData::load_from_file(file.path()).unwrap();
    assert_eq!(loaded.as_str(), "sk-round-trip-test-key");
  }

  #[test]
  fn load_nonexistent_file_returns_io_error() {
    let result = ApiKeyData::load_from_file("/tmp/nonexistent_api_key_file_12345.txt");
    assert!(result.is_err());
  }
}
