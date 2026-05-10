use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use std::collections::HashMap;
use std::error::Error;
use std::fmt::Display;
use std::path::Path;

const CURRENT_VERSION: u8 = 1;

#[derive(Clone)]
pub struct WebLoginData {
  pub cookies_header: Option<String>,
  pub additional_headers: Option<HashMap<String, String>>,

  pub username: Option<String>,
  pub email_address: Option<String>,

  pub created_at: Option<DateTime<Utc>>,
  pub updated_at: Option<DateTime<Utc>>,
}

impl WebLoginData {
  pub fn new() -> Self {
    Self {
      cookies_header: None,
      additional_headers: None,
      username: None,
      email_address: None,
      created_at: None,
      updated_at: None,
    }
  }

  pub fn load_from_file<P: AsRef<Path>>(file_path: P) -> Result<Self, WebLoginDataError> {
    let contents = std::fs::read_to_string(file_path)
      .map_err(WebLoginDataError::IoError)?;

    let serializable: WebLoginDataSerializable = serde_json::from_str(&contents)
      .map_err(WebLoginDataError::DeserializeError)?;

    Ok(Self {
      cookies_header: serializable.cookies_header,
      additional_headers: serializable.additional_headers,
      username: serializable.username,
      email_address: serializable.email_address,
      created_at: serializable.created_at,
      updated_at: serializable.updated_at,
    })
  }

  pub fn save_to_file<P: AsRef<Path>>(&self, file_path: P) -> Result<(), WebLoginDataError> {
    let serializable = WebLoginDataSerializable {
      version: CURRENT_VERSION,
      cookies_header: self.cookies_header.clone(),
      additional_headers: self.additional_headers.clone(),
      username: self.username.clone(),
      email_address: self.email_address.clone(),
      created_at: self.created_at,
      updated_at: self.updated_at,
    };

    let contents = serde_json::to_string_pretty(&serializable)
      .map_err(WebLoginDataError::SerializeError)?;

    std::fs::write(file_path, contents)
      .map_err(WebLoginDataError::IoError)?;

    Ok(())
  }
}

#[derive(Debug)]
pub enum WebLoginDataError {
  IoError(std::io::Error),
  DeserializeError(serde_json::Error),
  SerializeError(serde_json::Error),
}

impl Error for WebLoginDataError {
  fn source(&self) -> Option<&(dyn Error + 'static)> {
    match self {
      WebLoginDataError::IoError(e) => Some(e),
      WebLoginDataError::DeserializeError(e) => Some(e),
      WebLoginDataError::SerializeError(e) => Some(e),
      _ => None,
    }
  }
}

impl Display for WebLoginDataError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      WebLoginDataError::IoError(e) => write!(f, "IO error: {}", e),
      WebLoginDataError::DeserializeError(e) => write!(f, "Deserialization error: {}", e),
      WebLoginDataError::SerializeError(e) => write!(f, "Serialization error: {}", e),
    }
  }
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
struct WebLoginDataSerializable {
  version: u8,

  #[serde(skip_serializing_if = "Option::is_none")]
  cookies_header: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  additional_headers: Option<HashMap<String, String>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  username: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  email_address: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  created_at: Option<DateTime<Utc>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  updated_at: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use tempfile::NamedTempFile;
  use std::io::Write;

  #[test]
  fn save_writes_version() {
    let file = NamedTempFile::new().unwrap();
    let data = WebLoginData::new();
    data.save_to_file(file.path()).unwrap();

    let contents = std::fs::read_to_string(file.path()).unwrap();
    assert!(contents.contains("\"version\": 1"));
  }

  #[test]
  fn load_reads_all_fields() {
    let mut file = NamedTempFile::new().unwrap();
    write!(file, r#"{{
      "version": 1,
      "cookies_header": "session=abc123; visitor=xyz",
      "additional_headers": {{"Authorization": "Bearer tok"}},
      "username": "testuser",
      "email_address": "test@example.com",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-05-10T12:00:00Z"
    }}"#).unwrap();

    let data = WebLoginData::load_from_file(file.path()).unwrap();
    assert_eq!(data.cookies_header.as_deref(), Some("session=abc123; visitor=xyz"));
    assert_eq!(data.username.as_deref(), Some("testuser"));
    assert_eq!(data.email_address.as_deref(), Some("test@example.com"));
    assert!(data.additional_headers.is_some());
    let headers = data.additional_headers.unwrap();
    assert_eq!(headers.get("Authorization").unwrap(), "Bearer tok");
    assert!(data.created_at.is_some());
    assert!(data.updated_at.is_some());
  }

  #[test]
  fn load_tolerates_absent_optional_fields() {
    let mut file = NamedTempFile::new().unwrap();
    write!(file, r#"{{"version": 1}}"#).unwrap();

    let data = WebLoginData::load_from_file(file.path()).unwrap();
    assert!(data.cookies_header.is_none());
    assert!(data.additional_headers.is_none());
    assert!(data.username.is_none());
    assert!(data.email_address.is_none());
    assert!(data.created_at.is_none());
    assert!(data.updated_at.is_none());
  }

  #[test]
  fn load_tolerates_null_fields() {
    let mut file = NamedTempFile::new().unwrap();
    write!(file, r#"{{
      "version": 1,
      "cookies_header": null,
      "username": null,
      "email_address": null
    }}"#).unwrap();

    let data = WebLoginData::load_from_file(file.path()).unwrap();
    assert!(data.cookies_header.is_none());
    assert!(data.username.is_none());
    assert!(data.email_address.is_none());
  }

  #[test]
  fn load_invalid_json_returns_error() {
    let mut file = NamedTempFile::new().unwrap();
    write!(file, "not valid json at all").unwrap();

    let result = WebLoginData::load_from_file(file.path());
    assert!(result.is_err());
  }

  #[test]
  fn load_nonexistent_file_returns_io_error() {
    let result = WebLoginData::load_from_file("/tmp/nonexistent_web_login_12345.json");
    assert!(result.is_err());
  }

  #[test]
  fn round_trip_full() {
    let file = NamedTempFile::new().unwrap();

    let mut headers = HashMap::new();
    headers.insert("X-Custom".to_string(), "value".to_string());

    let now = Utc::now();

    let original = WebLoginData {
      cookies_header: Some("session=roundtrip".to_string()),
      additional_headers: Some(headers),
      username: Some("round_trip_user".to_string()),
      email_address: Some("rt@example.com".to_string()),
      created_at: Some(now),
      updated_at: Some(now),
    };

    original.save_to_file(file.path()).unwrap();
    let loaded = WebLoginData::load_from_file(file.path()).unwrap();

    assert_eq!(loaded.cookies_header.as_deref(), Some("session=roundtrip"));
    assert_eq!(loaded.username.as_deref(), Some("round_trip_user"));
    assert_eq!(loaded.email_address.as_deref(), Some("rt@example.com"));
    assert_eq!(loaded.additional_headers.as_ref().unwrap().get("X-Custom").unwrap(), "value");
    assert!(loaded.created_at.is_some());
    assert!(loaded.updated_at.is_some());
  }

  #[test]
  fn round_trip_minimal() {
    let file = NamedTempFile::new().unwrap();

    let original = WebLoginData::new();
    original.save_to_file(file.path()).unwrap();

    let loaded = WebLoginData::load_from_file(file.path()).unwrap();
    assert!(loaded.cookies_header.is_none());
    assert!(loaded.additional_headers.is_none());
    assert!(loaded.username.is_none());
    assert!(loaded.email_address.is_none());
  }
}
