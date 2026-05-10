use std::collections::HashMap;
use std::error::Error;
use std::fmt::Display;
use std::path::Path;
use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use crate::core::artcraft_error::ArtcraftError;

const CURRENT_VERSION: u8 = 1;

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
