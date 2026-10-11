//! The provider accounts, in the same files as the Tauri app (`~/Artcraft/credentials`), so an
//! account connected in either app works in both: the Midjourney login
//! (`midjourney_cookies.toml`) and the fal API key (`fal.api_key.txt`).

use std::path::{Path, PathBuf};
use std::sync::Arc;

use log::warn;
use midjourney_client::credentials::credential_manager::MidjourneyCredentialManager;

const MIDJOURNEY_FILENAME: &str = "midjourney_cookies.toml";
/// The Tauri app's pre-TOML Midjourney state, removed on disconnect so it can't come back.
const MIDJOURNEY_LEGACY_FILENAME: &str = "midjourney_state.json";
const FAL_KEY_FILENAME: &str = "fal.api_key.txt";

#[derive(Clone)]
pub struct ProviderAccounts {
  pub midjourney: MidjourneyCredentialManager,
  fal_key_path: Arc<PathBuf>,
}

impl ProviderAccounts {
  pub fn load(data_root: &Path) -> Self {
    let dir = data_root.join("credentials");
    if let Err(err) = std::fs::create_dir_all(&dir) {
      warn!("Couldn't create {}: {err}", dir.display());
    }
    let (path, legacy) = (dir.join(MIDJOURNEY_FILENAME), vec![dir.join(MIDJOURNEY_LEGACY_FILENAME)]);
    let midjourney = MidjourneyCredentialManager::load(path.clone(), legacy.clone()).unwrap_or_else(|err| {
      warn!("Couldn't load the Midjourney login: {err}");
      MidjourneyCredentialManager::new(path, legacy, None)
    });
    Self { midjourney, fal_key_path: Arc::new(dir.join(FAL_KEY_FILENAME)) }
  }

  /// The connected Midjourney account's email ("" when it's connected but unknown), or `None`.
  pub fn midjourney_account(&self) -> Option<String> {
    match (self.midjourney.maybe_copy_cookie_store(), self.midjourney.maybe_account_info()) {
      (Ok(None), Ok(None)) | (Err(_), _) | (_, Err(_)) => None,
      (_, Ok(info)) => Some(info.and_then(|i| i.maybe_email).unwrap_or_default()),
    }
  }

  pub fn fal_key(&self) -> Option<String> {
    std::fs::read_to_string(&*self.fal_key_path).ok().map(|k| k.trim().to_owned()).filter(|k| !k.is_empty())
  }

  /// The key as Settings shows it (`first6********`).
  pub fn fal_key_hint(&self) -> Option<String> {
    self.fal_key().map(|k| mask_key(&k))
  }

  pub fn set_fal_key(&self, key: &str) -> std::io::Result<()> {
    std::fs::write(&*self.fal_key_path, key.trim())
  }

  pub fn clear_fal_key(&self) -> std::io::Result<()> {
    match std::fs::remove_file(&*self.fal_key_path) {
      Err(err) if err.kind() != std::io::ErrorKind::NotFound => Err(err),
      _ => Ok(()),
    }
  }
}

/// `first6********`, or just the stars for short keys (`provider_list_command`).
fn mask_key(key: &str) -> String {
  if key.chars().count() > 6 {
    format!("{}********", key.chars().take(6).collect::<String>())
  } else {
    "********".to_owned()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn fal_keys_are_trimmed_masked_and_cleared() {
    let dir = std::env::temp_dir().join(format!("artcraft-native-accounts-{}", uuid::Uuid::new_v4()));
    let accounts = ProviderAccounts::load(&dir);
    assert_eq!(accounts.fal_key(), None);
    accounts.set_fal_key("  abcdef123456:secret \n").unwrap();
    assert_eq!(accounts.fal_key().as_deref(), Some("abcdef123456:secret"));
    assert_eq!(accounts.fal_key_hint().as_deref(), Some("abcdef********"));
    accounts.clear_fal_key().unwrap();
    accounts.clear_fal_key().unwrap();
    assert_eq!(accounts.fal_key(), None);
    assert_eq!(mask_key("short"), "********");
    assert_eq!(accounts.midjourney_account(), None);
    let _ = std::fs::remove_dir_all(dir);
  }
}
