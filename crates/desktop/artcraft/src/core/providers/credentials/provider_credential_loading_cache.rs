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
  maybe_payload: Option<ProviderCredentialPayload>,
  loaded_at: Instant,
}

#[derive(Clone)]
pub struct ProviderCredentialLoadingCache {
  inner: Arc<RwLock<HashMap<ProviderCredentialKey, CacheEntry>>>,
  app_data_root: AppDataRoot,
  ttl: Duration,
  #[cfg(test)]
  maybe_wavespeed_entry: Option<Arc<keyring::Entry>>,
}

impl ProviderCredentialLoadingCache {
  /// Create a shared credential cache with a five-minute lifetime for successful and absent reads.
  pub fn new(app_data_root: AppDataRoot) -> Self {
    Self {
      inner: Arc::new(RwLock::new(HashMap::new())),
      app_data_root,
      ttl: Duration::from_secs(300), // 5 minutes
      #[cfg(test)]
      maybe_wavespeed_entry: None,
    }
  }

  /// Create a shared cache with an explicit expiration interval.
  pub fn new_with_ttl(app_data_root: AppDataRoot, ttl: Duration) -> Self {
    Self {
      inner: Arc::new(RwLock::new(HashMap::new())),
      app_data_root,
      ttl,
      #[cfg(test)]
      maybe_wavespeed_entry: None,
    }
  }

  /// Seed credentials in memory so command tests never access a real OS credential store.
  #[cfg(test)]
  pub(crate) fn with_test_credentials(app_data_root: AppDataRoot, key: ProviderCredentialKey, maybe_payload: Option<ProviderCredentialPayload>) -> Self {
    let cache = Self::new(app_data_root);
    cache.inner.write().unwrap().insert(key, CacheEntry { maybe_payload, loaded_at: Instant::now() });
    cache
  }

  /// Return cached credentials or absence; retry storage failures instead of caching them.
  pub fn get_credentials(
    &self,
    key: ProviderCredentialKey,
  ) -> Result<Option<ProviderCredentialPayload>, ProviderCredentialLoadingCacheError> {
    self.get_or_load(key, || self.load_credentials(key))
  }

  /// Invalidate before writing storage; publish the new cached key only after all writes succeed.
  pub fn save_credentials(
    &self,
    key: ProviderCredentialKey,
    payload: ProviderCredentialPayload,
  ) -> Result<(), ProviderCredentialLoadingCacheError> {
    let mut cache = self.inner.write()
      .map_err(|_| ProviderCredentialLoadingCacheError::LockPoisoned)?;
    cache.remove(&key);
    let file_path = self.app_data_root.credentials_dir().path().join(key.get_filename());

    info!("Saving credential to disk: {:?}", file_path);

    match (&payload, key.get_type()) {
      (ProviderCredentialPayload::ApiKey(data), ProviderCredentialType::ApiKey) => {
        if key == ProviderCredentialKey::WaveSpeedApiKey {
          super::wavespeed_keychain::save(self.wavespeed_entry(&file_path)?.as_ref(), &file_path, data)
            .map_err(|_| ProviderCredentialLoadingCacheError::SecureStorage)?;
        } else {
          data.save_to_file(&file_path).map_err(ProviderCredentialLoadingCacheError::ApiKeyError)?;
        }
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

    cache.insert(key, CacheEntry { maybe_payload: Some(payload), loaded_at: Instant::now() });

    Ok(())
  }

  /// Invalidate a cached entry, forcing a re-read from disk on next access.
  pub fn invalidate(&self, key: ProviderCredentialKey) {
    if let Ok(mut cache) = self.inner.write() {
      cache.remove(&key);
    }
  }
  
  /// Invalidate before deleting storage so partial cleanup failures cannot retain a removed key.
  pub fn delete_credentials(&self, key: ProviderCredentialKey) -> Result<(), ProviderCredentialLoadingCacheError> {
    let mut cache = self.inner.write()
      .map_err(|_| ProviderCredentialLoadingCacheError::LockPoisoned)?;
    cache.remove(&key);
    let file_path = self.app_data_root.credentials_dir().path().join(key.get_filename());
    if key == ProviderCredentialKey::WaveSpeedApiKey {
      super::wavespeed_keychain::delete(self.wavespeed_entry(&file_path)?.as_ref(), &file_path)
        .map_err(|_| ProviderCredentialLoadingCacheError::SecureStorage)?;
    }
    
    if file_path.exists() {
      std::fs::remove_file(file_path)
          .map_err(|e| ProviderCredentialLoadingCacheError::IoError(e))?;
    }
    
    cache.insert(key, CacheEntry { maybe_payload: None, loaded_at: Instant::now() });
    
    Ok(())
  }

  /// Serialize cache loads with mutations and cache only successful storage results.
  fn get_or_load(&self, key: ProviderCredentialKey, load: impl FnOnce() -> Result<Option<ProviderCredentialPayload>, ProviderCredentialLoadingCacheError>) -> Result<Option<ProviderCredentialPayload>, ProviderCredentialLoadingCacheError> {
    let mut cache = self.inner.write()
      .map_err(|_| ProviderCredentialLoadingCacheError::LockPoisoned)?;
    if let Some(entry) = cache.get(&key) {
      if entry.loaded_at.elapsed() < self.ttl {
        return Ok(entry.maybe_payload.clone());
      }
    }
    let maybe_payload = load()?;
    cache.insert(key, CacheEntry { maybe_payload: maybe_payload.clone(), loaded_at: Instant::now() });
    Ok(maybe_payload)
  }

  /// Read WaveSpeed through the OS store and other providers through their existing credential files.
  fn load_credentials(&self, key: ProviderCredentialKey) -> Result<Option<ProviderCredentialPayload>, ProviderCredentialLoadingCacheError> {
    let file_path = self.app_data_root.credentials_dir().path().join(key.get_filename());
    if key == ProviderCredentialKey::WaveSpeedApiKey {
      return super::wavespeed_keychain::load(self.wavespeed_entry(&file_path)?.as_ref(), &file_path)
        .map(|data| data.map(ProviderCredentialPayload::ApiKey))
        .map_err(|_| ProviderCredentialLoadingCacheError::SecureStorage);
    }
    if !file_path.exists() {
      return Ok(None);
    }
    info!("Loading credential from disk: {:?}", file_path);
    let payload = match key.get_type() {
      ProviderCredentialType::ApiKey => ProviderCredentialPayload::ApiKey(ApiKeyData::load_from_file(&file_path).map_err(ProviderCredentialLoadingCacheError::ApiKeyError)?),
      ProviderCredentialType::WebLogin => ProviderCredentialPayload::WebLogin(WebLoginData::load_from_file(&file_path).map_err(ProviderCredentialLoadingCacheError::WebLoginError)?),
    };
    Ok(Some(payload))
  }

  /// Create the profile-scoped secure entry, substituting a mock entry only in unit tests.
  fn wavespeed_entry(&self, path: &std::path::Path) -> Result<Arc<keyring::Entry>, ProviderCredentialLoadingCacheError> {
    #[cfg(test)]
    if let Some(entry) = &self.maybe_wavespeed_entry { return Ok(entry.clone()); }
    super::wavespeed_keychain::entry(path).map(Arc::new).map_err(|_| ProviderCredentialLoadingCacheError::SecureStorage)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::sync::mpsc;

  mod mutation_failures {
    use super::*;

    #[test]
    fn failed_wave_speed_saves_reload_storage_instead_of_reusing_the_previous_key() {
      for fail_cleanup in [false, true] {
        let directory = tempfile::tempdir().unwrap();
        let root = AppDataRoot::create_existing(directory.path()).unwrap();
        let path = root.credentials_dir().path().join(ProviderCredentialKey::WaveSpeedApiKey.get_filename());
        let entry = Arc::new(keyring::Entry::new_with_credential(Box::new(keyring::mock::MockCredential::default())));
        let mut cache = ProviderCredentialLoadingCache::new(root);
        cache.maybe_wavespeed_entry = Some(entry.clone());
        let key = ProviderCredentialKey::WaveSpeedApiKey;
        cache.save_credentials(key, payload("original")).unwrap();
        if fail_cleanup {
          std::fs::create_dir(&path).unwrap();
        } else {
          let credential: &keyring::mock::MockCredential = entry.get_credential().downcast_ref().unwrap();
          credential.set_error(keyring::Error::NoStorageAccess(Box::new(std::io::Error::other("locked"))));
        }
        assert!(matches!(cache.save_credentials(key, payload("replacement")), Err(ProviderCredentialLoadingCacheError::SecureStorage)));
        assert!(!cache.inner.read().unwrap().contains_key(&key));
        if fail_cleanup {
          assert_eq!(entry.get_password().unwrap(), "replacement");
          assert!(cache.get_credentials(key).is_err());
          std::fs::remove_dir(&path).unwrap();
        }
        assert_key(cache.get_credentials(key).unwrap(), if fail_cleanup { "replacement" } else { "original" });
      }
    }

    #[test]
    fn failed_wave_speed_deletes_cannot_keep_a_deleted_key_in_memory() {
      for fail_cleanup in [false, true] {
        let directory = tempfile::tempdir().unwrap();
        let root = AppDataRoot::create_existing(directory.path()).unwrap();
        let path = root.credentials_dir().path().join(ProviderCredentialKey::WaveSpeedApiKey.get_filename());
        let entry = Arc::new(keyring::Entry::new_with_credential(Box::new(keyring::mock::MockCredential::default())));
        let mut cache = ProviderCredentialLoadingCache::new(root);
        cache.maybe_wavespeed_entry = Some(entry.clone());
        let key = ProviderCredentialKey::WaveSpeedApiKey;
        cache.save_credentials(key, payload("original")).unwrap();
        if fail_cleanup {
          std::fs::create_dir(&path).unwrap();
        } else {
          let credential: &keyring::mock::MockCredential = entry.get_credential().downcast_ref().unwrap();
          credential.set_error(keyring::Error::NoStorageAccess(Box::new(std::io::Error::other("locked"))));
        }
        assert!(matches!(cache.delete_credentials(key), Err(ProviderCredentialLoadingCacheError::SecureStorage)));
        assert!(!cache.inner.read().unwrap().contains_key(&key));
        if fail_cleanup {
          assert!(matches!(entry.get_password(), Err(keyring::Error::NoEntry)));
          assert!(cache.get_credentials(key).is_err());
          std::fs::remove_dir(&path).unwrap();
          assert!(cache.get_credentials(key).unwrap().is_none());
        } else {
          assert_key(cache.get_credentials(key).unwrap(), "original");
        }
      }
    }
  }

  #[test]
  fn production_wave_speed_load_save_and_delete_share_a_cache_with_mock_keychain_storage() {
    let directory = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(directory.path()).unwrap();
    let entry = Arc::new(keyring::Entry::new_with_credential(Box::new(keyring::mock::MockCredential::default())));
    let mut cache = ProviderCredentialLoadingCache::new(root);
    cache.maybe_wavespeed_entry = Some(entry.clone());
    let key = ProviderCredentialKey::WaveSpeedApiKey;
    assert!(cache.get_credentials(key).unwrap().is_none());
    entry.set_password("original").unwrap();
    assert!(cache.get_credentials(key).unwrap().is_none());
    cache.invalidate(key);
    assert_key(cache.get_credentials(key).unwrap(), "original");
    entry.set_password("external update").unwrap();
    assert_key(cache.get_credentials(key).unwrap(), "original");
    let credential: &keyring::mock::MockCredential = entry.get_credential().downcast_ref().unwrap();
    credential.set_error(keyring::Error::NoStorageAccess(Box::new(std::io::Error::other("locked"))));
    assert_key(cache.get_credentials(key).unwrap(), "original");
    cache.invalidate(key);
    assert!(cache.get_credentials(key).is_err());
    assert_key(cache.get_credentials(key).unwrap(), "external update");
    cache.save_credentials(key, payload("new saved key")).unwrap();
    assert_key(cache.get_credentials(key).unwrap(), "new saved key");
    assert_eq!(entry.get_password().unwrap(), "new saved key");
    cache.delete_credentials(key).unwrap();
    credential.set_error(keyring::Error::NoStorageAccess(Box::new(std::io::Error::other("locked"))));
    assert!(cache.get_credentials(key).unwrap().is_none());
  }

  #[test]
  fn caches_success_and_absence_but_retries_failures_and_expired_entries() {
    let directory = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(directory.path()).unwrap();
    let cache = ProviderCredentialLoadingCache::new(root.clone());
    let key = ProviderCredentialKey::WaveSpeedApiKey;
    assert!(cache.get_or_load(key, || Err(ProviderCredentialLoadingCacheError::SecureStorage)).is_err());
    assert!(cache.get_or_load(key, || Ok(None)).unwrap().is_none());
    assert!(cache.get_or_load(key, || panic!("empty results must be cached")).unwrap().is_none());
    cache.invalidate(key);
    let loaded = cache.get_or_load(key, || Ok(Some(payload("key")))).unwrap();
    assert_key(loaded, "key");
    assert_key(cache.get_or_load(key, || panic!("successful reads must be cached")).unwrap(), "key");
    let expired = ProviderCredentialLoadingCache::new_with_ttl(root, Duration::ZERO);
    expired.get_or_load(key, || Ok(None)).unwrap();
    assert_key(expired.get_or_load(key, || Ok(Some(payload("fresh")))).unwrap(), "fresh");
  }

  #[test]
  fn in_flight_reads_cannot_restore_saved_or_deleted_credentials() {
    for delete in [false, true] {
      let directory = tempfile::tempdir().unwrap();
      let root = AppDataRoot::create_existing(directory.path()).unwrap();
      let cache = ProviderCredentialLoadingCache::new(root);
      let key = ProviderCredentialKey::FalApiKey;
      let (started, waiting) = mpsc::channel();
      let (release, blocked) = mpsc::channel();
      let reader_cache = cache.clone();
      let reader = std::thread::spawn(move || reader_cache.get_or_load(key, || {
        started.send(()).unwrap();
        blocked.recv().unwrap();
        Ok(Some(payload("old")))
      }).unwrap());
      waiting.recv().unwrap();
      let writer_cache = cache.clone();
      let writer = std::thread::spawn(move || {
        if delete { writer_cache.delete_credentials(key) } else { writer_cache.save_credentials(key, payload("new")) }.unwrap();
      });
      release.send(()).unwrap();
      reader.join().unwrap();
      writer.join().unwrap();
      let current = cache.get_or_load(key, || panic!("mutation must update the cache")).unwrap();
      if delete { assert!(current.is_none()); } else { assert_key(current, "new"); }
    }
  }

  fn payload(value: &str) -> ProviderCredentialPayload {
    ProviderCredentialPayload::ApiKey(ApiKeyData::from_str(value))
  }

  fn assert_key(maybe_payload: Option<ProviderCredentialPayload>, expected: &str) {
    let Some(ProviderCredentialPayload::ApiKey(data)) = maybe_payload else { panic!("Expected API key") };
    assert_eq!(data.as_str(), expected);
  }
}

#[derive(Debug)]
pub enum ProviderCredentialLoadingCacheError {
  IoError(std::io::Error),
  ApiKeyError(ApiKeyDataError),
  WebLoginError(WebLoginDataError),
  TypeMismatch,
  LockPoisoned,
  SecureStorage,
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
      Self::SecureStorage => write!(f, "Could not access the system credential store. Unlock your keychain or Secret Service and try again."),
    }
  }
}
