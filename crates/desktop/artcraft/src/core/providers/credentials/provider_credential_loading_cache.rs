use std::collections::HashMap;
use std::error::Error;
use std::fmt::Display;
use std::path::Path;
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
    self.get_with_loader(key, load_payload)
  }

  fn get_with_loader(
    &self,
    key: ProviderCredentialKey,
    load: impl FnOnce(&Path, ProviderCredentialType) -> Result<ProviderCredentialPayload, ProviderCredentialLoadingCacheError>,
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

    // Serialize the complete disk-read/cache-insert transaction with writes
    // and deletes. Recheck because another reader may have populated it.
    let mut cache = self.inner.write().map_err(|_| ProviderCredentialLoadingCacheError::LockPoisoned)?;
    if let Some(entry) = cache.get(&key) {
      if entry.loaded_at.elapsed() < self.ttl { return Ok(Some(entry.payload.clone())); }
    }
    let file_path = self.app_data_root.credentials_dir().path().join(key.get_filename());
    if !file_path.exists() {
      cache.remove(&key);
      return Ok(None);
    }
    info!("Loading credential from disk: {:?}", file_path);
    let payload = load(&file_path, key.get_type())?;

    cache.insert(key, CacheEntry { payload: payload.clone(), loaded_at: Instant::now() });

    Ok(Some(payload))
  }

  pub fn save_credentials(
    &self,
    key: ProviderCredentialKey,
    payload: ProviderCredentialPayload,
  ) -> Result<(), ProviderCredentialLoadingCacheError> {
    let mut cache = self.inner.write().map_err(|_| ProviderCredentialLoadingCacheError::LockPoisoned)?;
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

    cache.insert(key, CacheEntry { payload, loaded_at: Instant::now() });

    Ok(())
  }

  /// Invalidate a cached entry, forcing a re-read from disk on next access.
  pub fn invalidate(&self, key: ProviderCredentialKey) {
    if let Ok(mut cache) = self.inner.write() {
      cache.remove(&key);
    }
  }
  
  pub fn delete_credentials(&self, key: ProviderCredentialKey) -> Result<(), ProviderCredentialLoadingCacheError> {
    let mut cache = self.inner.write().map_err(|_| ProviderCredentialLoadingCacheError::LockPoisoned)?;
    let file_path = self.app_data_root.credentials_dir().path().join(key.get_filename());
    
    if file_path.exists() {
      std::fs::remove_file(file_path)
          .map_err(|e| ProviderCredentialLoadingCacheError::IoError(e))?;
    }
    
    cache.remove(&key);
    
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

fn load_payload(path: &Path, kind: ProviderCredentialType) -> Result<ProviderCredentialPayload, ProviderCredentialLoadingCacheError> {
  match kind {
    ProviderCredentialType::ApiKey => ApiKeyData::load_from_file(path).map(ProviderCredentialPayload::ApiKey).map_err(ProviderCredentialLoadingCacheError::ApiKeyError),
    ProviderCredentialType::WebLogin => WebLoginData::load_from_file(path).map(ProviderCredentialPayload::WebLogin).map_err(ProviderCredentialLoadingCacheError::WebLoginError),
  }
}

#[cfg(test)]
mod credential_cache_tests {
  use super::*;
  use std::sync::mpsc::channel;

  #[test]
  fn delete_waits_for_inflight_load_and_cannot_be_undone_by_it() { interleave(false); }

  #[test]
  fn replacement_waits_for_inflight_load_and_remains_current() { interleave(true); }

  fn interleave(replace: bool) {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let cache = ProviderCredentialLoadingCache::new(root.clone());
    let key = ProviderCredentialKey::FalApiKey;
    let path = root.credentials_dir().path().join(key.get_filename());
    ApiKeyData::from_str("old-test-key").save_to_file(&path).unwrap();
    let (loaded_tx, loaded_rx) = channel();
    let (resume_tx, resume_rx) = channel();
    let reader_cache = cache.clone();
    let reader = std::thread::spawn(move || reader_cache.get_with_loader(key, |path, kind| {
      let payload = load_payload(path, kind)?;
      loaded_tx.send(()).unwrap();
      resume_rx.recv().unwrap();
      Ok(payload)
    }).unwrap());
    loaded_rx.recv_timeout(Duration::from_secs(2)).unwrap();
    let writer_cache = cache.clone();
    let (done_tx, done_rx) = channel();
    let writer = std::thread::spawn(move || {
      if replace { writer_cache.save_credentials(key, ProviderCredentialPayload::ApiKey(ApiKeyData::from_str("new-test-key"))).unwrap(); }
      else { writer_cache.delete_credentials(key).unwrap(); }
      done_tx.send(()).unwrap();
    });
    let waiting = done_rx.recv_timeout(Duration::from_millis(50)).is_err();
    resume_tx.send(()).unwrap();
    reader.join().unwrap();
    writer.join().unwrap();
    assert!(waiting, "mutation must serialize with the disk read, not just the cache insertion");
    match cache.get_credentials(key).unwrap() {
      Some(ProviderCredentialPayload::ApiKey(value)) if replace => assert_eq!(value.as_str(), "new-test-key"),
      None if !replace => assert!(!path.exists()),
      _ => panic!("stale credentials survived the mutation"),
    }
  }
}
