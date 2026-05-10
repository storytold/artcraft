use std::error::Error;
use std::fmt::Display;
use std::path::Path;

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
