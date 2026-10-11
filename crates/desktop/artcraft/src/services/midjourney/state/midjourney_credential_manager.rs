//! The app's Midjourney login: the shared manager (`midjourney_client`, also used by the native
//! app) kept in the app's credentials directory, plus the one-time migration from the legacy
//! `midjourney_state.json`.

use std::ops::Deref;

use cookie_store_wrapper::cookie_store::CookieStore;
use midjourney_client::credentials::credential_file::{MidjourneyAccountInfo, MidjourneyCredential};
use midjourney_client::credentials::credential_manager::{MIDJOURNEY_ORIGIN, MidjourneyCredentialManager as SharedCredentialManager, populate_account_info};
use midjourney_client::credentials::midjourney_user_id::MidjourneyUserId;
use url::Url;

pub use midjourney_client::credentials::credential_manager::MidjourneySession;

use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::midjourney::state::midjourney_user_info::MidjourneyUserInfo;
use crate::services::midjourney::state::serializable_midjourney_state::SerializableMidjourneyState;

#[derive(Clone)]
pub struct MidjourneyCredentialManager(SharedCredentialManager);

impl Deref for MidjourneyCredentialManager {
  type Target = SharedCredentialManager;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl MidjourneyCredentialManager {
  pub fn initialize_empty(app_data_root: &AppDataRoot) -> Self {
    let dir = app_data_root.credentials_dir();
    Self(SharedCredentialManager::new(dir.get_midjourney_credential_path(), vec![dir.get_midjourney_state_path()], None))
  }

  pub fn initialize_from_disk_infallible(app_data_root: &AppDataRoot) -> Self {
    match load_or_migrate(app_data_root) {
      Ok(manager) => manager,
      Err(err) => {
        log::warn!("Could not load Midjourney credentials: {}", err);
        Self::initialize_empty(app_data_root)
      },
    }
  }

  pub fn maybe_copy_user_info(&self) -> anyhow::Result<Option<MidjourneyUserInfo>> {
    Ok(self.maybe_account_info()?.map(|info| MidjourneyUserInfo { user_id: info.maybe_user_id.map(MidjourneyUserId::from_string), email: info.maybe_email, websocket_token: None }))
  }
}

fn load_or_migrate(root: &AppDataRoot) -> anyhow::Result<MidjourneyCredentialManager> {
  let dir = root.credentials_dir();
  let (path, legacy_path) = (dir.get_midjourney_credential_path(), dir.get_midjourney_state_path());
  if path.exists() || !legacy_path.exists() {
    return Ok(MidjourneyCredentialManager(SharedCredentialManager::load(path, vec![legacy_path])?));
  }
  let legacy: SerializableMidjourneyState = serde_json::from_str(&std::fs::read_to_string(&legacy_path)?)?;
  let Some(cookies) = legacy.user_cookies else {
    return Ok(MidjourneyCredentialManager::initialize_empty(root));
  };
  let cookies = CookieStore::from_cookie_header(&cookies.to_cookie_store().to_cookie_string(), &Url::parse(MIDJOURNEY_ORIGIN)?);
  let mut credential = MidjourneyCredential::new(cookies);
  credential.maybe_user_info = legacy.user_info.map(|info| MidjourneyAccountInfo { maybe_user_id: info.user_id, maybe_email: info.email, maybe_username: None });
  populate_account_info(&mut credential);
  credential.save(&path)?;
  Ok(MidjourneyCredentialManager(SharedCredentialManager::new(path, vec![legacy_path], Some(credential))))
}

#[cfg(test)]
mod tests {
  use base64::prelude::{BASE64_URL_SAFE_NO_PAD, Engine};
  use chrono::Utc;
  use tempfile::TempDir;

  use super::*;
  use crate::core::state::data_dir::trait_data_subdir::DataSubdir;

  const TEST_USER_ID: &str = "00000000-0000-4000-8000-000000000001";
  const AUTH_ID: &str = "__Host-Midjourney.AuthUserTokenV3_i";
  const AUTH_REFRESH: &str = "__Host-Midjourney.AuthUserTokenV3_r";

  #[tokio::test]
  async fn migrates_legacy_cookies_and_logout_does_not_touch_artcraft() {
    let (_dir, root) = root();
    let legacy = root.credentials_dir().get_midjourney_state_path();
    let artcraft = root.credentials_dir().get_storyteller_session_cookie_file_path();
    std::fs::write(&artcraft, "existing-artcraft-session").unwrap();
    std::fs::write(
      &legacy,
      serde_json::json!({
        "version": 1,
        "user_cookies": {"cookies": [
          {"name": AUTH_ID, "value": token(Utc::now().timestamp() + 3600)},
          {"name": AUTH_REFRESH, "value": "test-refresh"}
        ]},
        "user_info": {"user_id": TEST_USER_ID, "email": "test@example.invalid", "websocket_token": "old-socket-token"}
      })
      .to_string(),
    )
    .unwrap();
    let manager = MidjourneyCredentialManager::initialize_from_disk_infallible(&root);
    let session = manager.session().await.unwrap().unwrap();
    assert_eq!(session.user_id.as_str(), TEST_USER_ID);
    let contents = std::fs::read_to_string(root.credentials_dir().get_midjourney_credential_path()).unwrap();
    assert!(contents.contains("midjourney_cookies"));
    assert!(!contents.contains("old-socket-token"));
    assert!(legacy.exists(), "migration preserves the old file until logout");
    let reloaded = MidjourneyCredentialManager::initialize_from_disk_infallible(&root);
    assert_eq!(reloaded.session().await.unwrap().unwrap().credential_id, session.credential_id);
    manager.clear_credentials().await.unwrap();
    assert!(!legacy.exists());
    assert!(!root.credentials_dir().get_midjourney_credential_path().exists());
    assert_eq!(std::fs::read_to_string(artcraft).unwrap(), "existing-artcraft-session");
    let reloaded = MidjourneyCredentialManager::initialize_from_disk_infallible(&root);
    assert!(reloaded.session().await.unwrap().is_none());
  }

  #[test]
  fn corrupt_modern_credential_does_not_revive_legacy_state() {
    let (_dir, root) = root();
    std::fs::write(root.credentials_dir().get_midjourney_credential_path(), "not valid toml").unwrap();
    std::fs::write(root.credentials_dir().get_midjourney_state_path(), "{}").unwrap();
    assert!(load_or_migrate(&root).is_err());
  }

  fn root() -> (TempDir, AppDataRoot) {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    assert!(root.credentials_dir().path().exists());
    (dir, root)
  }

  fn token(exp: i64) -> String {
    let claims = serde_json::json!({"exp": exp, "midjourney_id": TEST_USER_ID});
    format!("header.{}.signature", BASE64_URL_SAFE_NO_PAD.encode(claims.to_string()))
  }
}
