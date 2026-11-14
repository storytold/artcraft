use std::path::Path;

use keyring::{Entry, Error};

use super::payload::api_key::ApiKeyData;

/// Scope the OS credential entry to the WaveSpeed service and the current profile path.
pub(super) fn entry(legacy_path: &Path) -> Result<Entry, Error> {
  Entry::new("ai.artcraft.app.wavespeed", &legacy_path.to_string_lossy())
}

/// Load the secure key or migrate bounded legacy plaintext only after secure storage succeeds.
pub(super) fn load(entry: &Entry, legacy_path: &Path) -> anyhow::Result<Option<ApiKeyData>> {
  match entry.get_password() {
    Ok(password) => {
      remove_legacy(legacy_path)?;
      Ok(Some(ApiKeyData::from_str(&password)))
    },
    Err(Error::NoEntry) => {
      if !legacy_path.try_exists()? {
        return Ok(None);
      }
      let bytes = crate::core::utils::read_bounded_file::read_bounded_file(legacy_path, 16 * 1024)?;
      let data = ApiKeyData::from_str(std::str::from_utf8(&bytes)?);
      entry.set_password(data.as_str())?;
      remove_legacy(legacy_path)?;
      Ok(Some(data))
    },
    Err(error) => Err(error.into()),
  }
}

/// Write the OS key before removing legacy plaintext; cleanup errors still propagate.
pub(super) fn save(entry: &Entry, legacy_path: &Path, data: &ApiKeyData) -> anyhow::Result<()> {
  entry.set_password(data.as_str())?;
  remove_legacy(legacy_path)
}

/// Remove the secure entry and legacy file; a cleanup failure may follow a successful deletion.
pub(super) fn delete(entry: &Entry, legacy_path: &Path) -> anyhow::Result<()> {
  match entry.delete_credential() {
    Ok(()) | Err(Error::NoEntry) => {},
    Err(error) => return Err(error.into()),
  }
  remove_legacy(legacy_path)
}

/// Remove legacy plaintext, tolerating absence but preserving other filesystem failures.
fn remove_legacy(path: &Path) -> anyhow::Result<()> {
  match std::fs::remove_file(path) {
    Ok(()) => Ok(()),
    Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
    Err(error) => Err(error.into()),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn migrates_plaintext_only_after_secure_storage_succeeds() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("wavespeed.api_key.txt");
    std::fs::write(&path, b"  fixture-key  ").unwrap();
    let entry = Entry::new_with_credential(Box::new(keyring::mock::MockCredential::default()));
    let credential: &keyring::mock::MockCredential = entry.get_credential().downcast_ref().unwrap();
    credential.set_error(Error::NoStorageAccess(Box::new(std::io::Error::other("locked"))));
    assert!(load(&entry, &path).is_err());
    assert!(path.exists());
    assert_eq!(load(&entry, &path).unwrap().unwrap().as_str(), "fixture-key");
    assert!(!path.exists());
    assert_eq!(entry.get_password().unwrap(), "fixture-key");
    save(&entry, &path, &ApiKeyData::from_str("replacement")).unwrap();
    assert!(!path.exists());
    delete(&entry, &path).unwrap();
    assert!(load(&entry, &path).unwrap().is_none());
  }
}
