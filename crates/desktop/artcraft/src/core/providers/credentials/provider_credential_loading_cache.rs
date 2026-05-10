use std::collections::HashMap;
use std::error::Error;
use std::fmt::Display;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

use log::{info, warn};

use crate::core::providers::credentials::payload::api_key::{ApiKeyData, ApiKeyDataError};
use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::credentials::payload::web_login::{WebLoginData, WebLoginDataError};
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::provider_credential_type::ProviderCredentialType;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;

struct CacheEntry {
  payload: ProviderCredentialPayload,
  loaded_at: Instant,
}

#[derive(Clone)]
pub struct ProviderCredentialLoadingCache {
  inner: Arc<RwLock<HashMap<ProviderCredentialKey, CacheEntry>>>,
  app_data_root: AppDataRoot,
  ttl: Duration,
}

impl ProviderCredentialLoadingCache {
  pub fn new(app_data_root: AppDataRoot) -> Self {
    Self {
      inner: Arc::new(RwLock::new(HashMap::new())),
      app_data_root,
      ttl: Duration::from_secs(300), // 5 minutes
    }
  }

  pub fn new_with_ttl(app_data_root: AppDataRoot, ttl: Duration) -> Self {
    Self {
      inner: Arc::new(RwLock::new(HashMap::new())),
      app_data_root,
      ttl,
    }
  }

  pub fn get_credentials(
    &self,
    key: ProviderCredentialKey,
  ) -> Result<Option<ProviderCredentialPayload>, ProviderCredentialLoadingCacheError> {
    // Check cache first.
    {
      let cache = self.inner.read()
        .map_err(|_| ProviderCredentialLoadingCacheError::LockPoisoned)?;

      if let Some(entry) = cache.get(&key) {
        if entry.loaded_at.elapsed() < self.ttl {
          return Ok(Some(entry.payload.clone()));
        }
      }
    }

    // Cache miss or expired — load from disk.
    let file_path = self.app_data_root.credentials_dir().path().join(key.get_filename());

    if !file_path.exists() {
      return Ok(None);
    }

    info!("Loading credential from disk: {:?}", file_path);

    let payload = match key.get_type() {
      ProviderCredentialType::ApiKey => {
        let data = ApiKeyData::load_from_file(&file_path)
          .map_err(ProviderCredentialLoadingCacheError::ApiKeyError)?;
        ProviderCredentialPayload::ApiKey(data)
      }
      ProviderCredentialType::WebLogin => {
        let data = WebLoginData::load_from_file(&file_path)
          .map_err(ProviderCredentialLoadingCacheError::WebLoginError)?;
        ProviderCredentialPayload::WebLogin(data)
      }
    };

    // Store in cache.
    {
      let mut cache = self.inner.write()
        .map_err(|_| ProviderCredentialLoadingCacheError::LockPoisoned)?;

      cache.insert(key, CacheEntry {
        payload: payload.clone(),
        loaded_at: Instant::now(),
      });
    }

    Ok(Some(payload))
  }

  pub fn save_credentials(
    &self,
    key: ProviderCredentialKey,
    payload: ProviderCredentialPayload,
  ) -> Result<(), ProviderCredentialLoadingCacheError> {
    let file_path = self.app_data_root.credentials_dir().path().join(key.get_filename());

    info!("Saving credential to disk: {:?}", file_path);

    match (&payload, key.get_type()) {
      (ProviderCredentialPayload::ApiKey(data), ProviderCredentialType::ApiKey) => {
        data.save_to_file(&file_path)
          .map_err(ProviderCredentialLoadingCacheError::ApiKeyError)?;
      }
      (ProviderCredentialPayload::WebLogin(data), ProviderCredentialType::WebLogin) => {
        data.save_to_file(&file_path)
          .map_err(ProviderCredentialLoadingCacheError::WebLoginError)?;
      }
      _ => {
        warn!("Credential type mismatch for key {:?}", key);
        return Err(ProviderCredentialLoadingCacheError::TypeMismatch);
      }
    }

    // Update cache.
    {
      let mut cache = self.inner.write()
        .map_err(|_| ProviderCredentialLoadingCacheError::LockPoisoned)?;

      cache.insert(key, CacheEntry {
        payload,
        loaded_at: Instant::now(),
      });
    }

    Ok(())
  }

  /// Invalidate a cached entry, forcing a re-read from disk on next access.
  pub fn invalidate(&self, key: ProviderCredentialKey) {
    if let Ok(mut cache) = self.inner.write() {
      cache.remove(&key);
    }
  }
  
  pub fn delete_credentials(&self, key: ProviderCredentialKey) -> Result<(), ProviderCredentialLoadingCacheError> {
    let file_path = self.app_data_root.credentials_dir().path().join(key.get_filename());
    
    if file_path.exists() {
      std::fs::remove_file(file_path)
          .map_err(|e| ProviderCredentialLoadingCacheError::IoError(e))?;
    }
    
    self.invalidate(key);
    
    Ok(())
  }
}

#[derive(Debug)]
pub enum ProviderCredentialLoadingCacheError {
  IoError(std::io::Error),
  ApiKeyError(ApiKeyDataError),
  WebLoginError(WebLoginDataError),
  TypeMismatch,
  LockPoisoned,
}

impl Error for ProviderCredentialLoadingCacheError {
  fn source(&self) -> Option<&(dyn Error + 'static)> {
    match self {
      Self::IoError(err) => Some(err),
      Self::ApiKeyError(err) => Some(err),
      Self::WebLoginError(err) => Some(err),
      _ => None,
    }
  }
}

impl Display for ProviderCredentialLoadingCacheError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::IoError(e) => write!(f, "IO error: {}", e),
      Self::ApiKeyError(e) => write!(f, "API key error: {}", e),
      Self::WebLoginError(e) => write!(f, "Web login error: {}", e),
      Self::TypeMismatch => write!(f, "Credential type does not match key type"),
      Self::LockPoisoned => write!(f, "Internal lock poisoned"),
    }
  }
}
