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
  
  pub fn load_from_file<P: AsRef<Path>>(file_path: P) -> Result<Self, ArtcraftError> {
    unimplemented!()
  }

  pub fn save_to_file<P: AsRef<Path>>(&self, file_path: P) -> Result<(), ArtcraftError> {
    unimplemented!()
  }
}

#[derive(Debug)]
pub enum WebLoginDataError {
  InvalidVersion,
  IoError(std::io::Error),
}

impl Error for WebLoginDataError {}

impl Display for WebLoginDataError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      WebLoginDataError::InvalidVersion => write!(f, "Invalid version"),
      WebLoginDataError::IoError(e) => write!(f, "IO error: {}", e),
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
