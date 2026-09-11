use crate::cookie::Cookie;
use crate::cookie_store::CookieStore;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt::{Debug, Display, Formatter};
use std::path::Path;

#[derive(Serialize, Deserialize)]
pub struct SerializableCookieStore {
  pub (crate) cookies: Vec<SerializedCookie>,
}

#[derive(Serialize, Deserialize)]
pub (crate) struct SerializedCookie {
  pub (crate) name: String,
  pub (crate) value: String,
}

#[derive(Debug)]
pub enum SerializableCookieStoreError {
  IoError(std::io::Error),
  SerializationError(serde_json::Error),
}

impl Error for SerializableCookieStoreError {}

impl Display for SerializableCookieStoreError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::IoError(err) => write!(f, "IO error: {}", err),
      Self::SerializationError(err) => write!(f, "Serialization error: {}", err),
    }
  }
}

impl SerializableCookieStore {
  pub fn read_from_file<P: AsRef<Path>>(
    file_path: P,
  ) -> Result<Self, SerializableCookieStoreError> {
    let content = std::fs::read_to_string(file_path)
        .map_err(|err| SerializableCookieStoreError::IoError(err))?;
    serde_json::from_str(&content)
        .map_err(|err| SerializableCookieStoreError::SerializationError(err))
  }
  
  pub fn write_to_file<P: AsRef<Path>>(
    &self,
    file_path: P,
  ) -> Result<(), SerializableCookieStoreError> {
    let serialized = serde_json::to_string(self)
        .map_err(|err| SerializableCookieStoreError::SerializationError(err))?;
    std::fs::write(file_path, serialized)
        .map_err(|err| SerializableCookieStoreError::IoError(err))
  }
  
  pub fn to_cookie_store(&self) -> CookieStore {
    let mut store = CookieStore::empty();
    for serialized_cookie in &self.cookies {
      store.add_cookie(Cookie::new_from_str(
        &serialized_cookie.name, 
        &serialized_cookie.value
      ));
    }
    store
  }
}
